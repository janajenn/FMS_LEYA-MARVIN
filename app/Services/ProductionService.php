<?php

namespace App\Services;

use App\Models\Material;
use App\Models\Product;
use App\Models\ProductionRun;
use App\Models\StockHistory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductionService
{
    public function __construct(
        protected MaterialRequirementCalculator $calculator
    ) {}

    /**
     * Record a production run for a product.
     *
     * Deducts the standard BOM materials, increases the finished-goods
     * stock, writes a production_runs row, and one stock_history row
     * per consumed material.
     *
     * Everything runs in a single DB transaction with row-level locks.
     * Any failure rolls back completely — no partial stock changes.
     *
     * @throws \InvalidArgumentException  when quantity < 1
     * @throws \RuntimeException          on variant mis-configuration, missing
     *                                    product, insufficient materials, or
     *                                    unauthenticated context
     */
    public function record(
        Product $product,
        int $quantity,
        ?int $variantId = null,
        ?string $notes = null
    ): ProductionRun {
        if ($quantity < 1) {
            throw new \InvalidArgumentException('Production quantity must be at least 1.');
        }

        $confirmedBy = Auth::id();
        if (! $confirmedBy) {
            throw new \RuntimeException(
                'Production runs must be recorded by an authenticated user.'
            );
        }

        return DB::transaction(function () use ($product, $quantity, $variantId, $notes, $confirmedBy) {
            // ── 1. Lock product row ──
            $locked = Product::where('id', $product->id)
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                throw new \RuntimeException('Product not found.');
            }

            $locked->loadMissing(['parts.designs', 'variants', 'materials']);

            // ── 2. Resolve variant ──
            $variant = null;
            if ($variantId !== null) {
                $variant = $locked->variants->firstWhere('id', $variantId);
                if (! $variant) {
                    throw new \RuntimeException(
                        'The selected wood type does not belong to this product.'
                    );
                }
            } elseif ($locked->variants->isNotEmpty()) {
                throw new \RuntimeException(
                    'This product has wood types. Please select which one to produce.'
                );
            }

            $variantMaterialId = $variant?->material_id;
            $finishOption      = $locked->finish_material_id ? 'standard' : 'ordinary';
            $partsData         = $this->buildStandardPartsData($locked);

            // ── 3. Calculate per-unit material requirements ──
            $perUnit = $this->calculator->calculateForUnit(
                $locked,
                $partsData,
                $variantMaterialId,
                $finishOption
            );

            $requirements = [];
            foreach ($perUnit as $materialId => $qtyPerUnit) {
                $needed = (float) $qtyPerUnit * $quantity;
                if ($needed > 0) {
                    $requirements[(int) $materialId] = $needed;
                }
            }

            if (empty($requirements)) {
                throw new \RuntimeException(
                    'No material requirements could be calculated for this product. '
                    . 'Check that it has parts with standard dimensions, a wood type, '
                    . 'or a finish material configured.'
                );
            }

            // ── 4. Lock materials in ascending id order (deadlock prevention) ──
            $materialIds = array_keys($requirements);
            sort($materialIds);

            $materials = Material::whereIn('id', $materialIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // ── 5. Validate sufficiency ──
            $insufficient = [];
            foreach ($requirements as $materialId => $needed) {
                $mat = $materials->get($materialId);
                if (! $mat) {
                    throw new \RuntimeException(
                        "Required material #{$materialId} no longer exists."
                    );
                }
                $available = (float) $mat->stock_quantity;
                if ($available < $needed) {
                    $insufficient[] = sprintf(
                        '%s: need %.2f %s, only %.2f available',
                        $mat->name, $needed, $mat->unit ?? 'unit', $available
                    );
                }
            }
            if (! empty($insufficient)) {
                throw new \RuntimeException(
                    "Insufficient materials:\n- " . implode("\n- ", $insufficient)
                );
            }

            // ── 6. Create production run header ──
            $run = ProductionRun::create([
                'product_id'   => $locked->id,
                'variant_id'   => $variantId,
                'quantity'     => $quantity,
                'notes'        => $notes,
                'confirmed_by' => $confirmedBy,
            ]);

            // ── 7. Deduct each material + write audit rows ──
            foreach ($requirements as $materialId => $needed) {
                $mat      = $materials->get($materialId);
                $previous = (float) $mat->stock_quantity;
                $new      = $previous - $needed;

                $mat->stock_quantity = $new;
                $mat->save();

                StockHistory::create([
                    'material_id'       => $materialId,
                    'reference_type'    => 'production',
                    'reference_id'      => $run->id,
                    'quantity_change'   => -$needed,
                    'previous_quantity' => $previous,
                    'new_quantity'      => $new,
                    'note'              => "Production run #{$run->id} — {$locked->name} × {$quantity}",
                    'created_by'        => $confirmedBy,
                ]);
            }

            // ── 8. Increase finished-goods stock ──
            $locked->stock_quantity   = (int) $locked->stock_quantity + $quantity;
            $locked->is_opening_stock = false;
            $locked->save();

            Log::info('[PRODUCTION] Run recorded', [
                'run_id'           => $run->id,
                'product_id'       => $locked->id,
                'product_name'     => $locked->name,
                'variant_id'       => $variantId,
                'quantity'         => $quantity,
                'materials_count'  => count($requirements),
                'total_consumed'   => array_sum($requirements),
                'confirmed_by'     => $confirmedBy,
            ]);

            // ── 9. Return with relations eager-loaded ──
            return $run->fresh([
                'product',
                'variant',
                'confirmer',
                'stockMovements.material',
            ]);
        });
    }

    /**
     * Build [part_id => [field => standard_value, design_id => default_design_id]]
     * from the product's canonical standard configuration.
     */
    protected function buildStandardPartsData(Product $product): array
    {
        $parts = [];

        foreach ($product->parts as $part) {
            $row = [];

            foreach (['length', 'width', 'height', 'thickness', 'diameter', 'depth'] as $field) {
                $standard = $part->{"standard_{$field}"};
                if ($standard !== null && $standard !== '') {
                    $row[$field] = (float) $standard;
                }
            }

            $default = $part->designs->firstWhere('is_default', true)
                    ?? $part->designs->first();
            if ($default) {
                $row['design_id'] = $default->id;
            }

            $parts[$part->id] = $row;
        }

        return $parts;
    }
}
