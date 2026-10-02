<?php

namespace App\Console\Commands;

use App\Models\Material;
use App\Models\Product;
use App\Models\StockHistory;
use App\Services\MaterialCalculationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BackfillMaterialDeductions extends Command
{
    protected $signature = 'products:backfill-material-deductions
                            {--dry-run      : Preview what would be deducted without making changes}
                            {--product=     : Process only this product ID}
                            {--user-id=     : User ID to attribute these deductions to (optional)}
                            {--force        : Skip the confirmation prompt}';

    protected $description = 'Deduct raw materials for existing products whose deductions were never applied (e.g. customizable products created before the fix). Safe to run multiple times — products with an existing stock_history record are skipped.';

    public function handle(MaterialCalculationService $calculator): int
    {
        $dryRun    = (bool) $this->option('dry-run');
        $productId = $this->option('product');
        $userId    = $this->option('user-id') ? (int) $this->option('user-id') : null;
        $force     = (bool) $this->option('force');

        $this->info('');
        $this->info('═══════════════════════════════════════════════════════');
        $this->info('  Material Deduction Backfill');
        $this->info('═══════════════════════════════════════════════════════');

        if ($dryRun) {
            $this->warn('  MODE: DRY RUN — no changes will be made');
        } else {
            $this->warn('  MODE: LIVE — materials will be deducted');
        }

        if ($productId) {
            $this->line('  Scope: single product #' . $productId);
        }

        $this->info('');

        // ─── Load candidate products ───
        $query = Product::with(['parts', 'materials'])
            ->where('stock_quantity', '>', 0)
            ->orderBy('id');

        if ($productId) {
            $query->where('id', (int) $productId);
        }

        $products = $query->get();

        if ($products->isEmpty()) {
            $this->warn('No products found with stock_quantity > 0 in the given scope.');
            return self::SUCCESS;
        }

        // ─── Classify products ───
        $toProcess = [];
        $skipped   = [];

        foreach ($products as $product) {
            if ($this->hasExistingDeduction($product)) {
                $skipped[] = $product;
                continue;
            }
            if ($product->materials->isEmpty()) {
                // Nothing to deduct — treat as "already handled"
                $skipped[] = $product;
                continue;
            }
            $toProcess[] = $product;
        }

        $this->line(sprintf('  Scanned           : %d product(s)', $products->count()));
        $this->line(sprintf('  Already deducted  : %d (will skip)', count($skipped)));
        $this->line(sprintf('  Needs deduction   : %d', count($toProcess)));
        $this->info('');

        if (empty($toProcess)) {
            $this->info('✔ Nothing to do. All targeted products are already accounted for.');
            return self::SUCCESS;
        }

        // ─── Show what will happen ───
        $this->line('─── Products to process ───');

        foreach ($toProcess as $product) {
            $perUnit = $this->getPerUnitRequirements($product, $calculator);

            $this->line(sprintf(
                '  [%d] %s  (customizable=%s, stock=%d)',
                $product->id,
                $product->name,
                $product->is_customizable ? 'yes' : 'no',
                $product->stock_quantity
            ));

            $anyMaterial = false;
            foreach ($product->materials as $material) {
                $qty = (float) ($perUnit[$material->id] ?? 0);
                if ($qty <= 0) continue;

                $total     = $qty * $product->stock_quantity;
                $available = (float) $material->stock_quantity;
                $after     = $available - $total;

                $status = $after < 0
                    ? sprintf('⚠️  SHORT by %s', number_format(abs($after), 2))
                    : sprintf('→ %s after', number_format($after, 2));

                $this->line(sprintf(
                    '        · %-25s  %s %s /unit × %d = %s %s   [%s avail, %s]',
                    $material->name,
                    number_format($qty, 4),
                    $material->unit ?? 'unit',
                    $product->stock_quantity,
                    number_format($total, 4),
                    $material->unit ?? 'unit',
                    number_format($available, 2),
                    $status
                ));

                $anyMaterial = true;
            }

            if (!$anyMaterial) {
                $this->line('        (no positive material requirements — will skip at runtime)');
            }
        }

        if ($dryRun) {
            $this->info('');
            $this->info('✔ Dry run complete. No changes were made.');
            $this->line('   Re-run without --dry-run to apply.');
            return self::SUCCESS;
        }

        // ─── Confirmation ───
        $this->info('');
        if (!$force && !$this->confirm(
            sprintf('Proceed with deductions for %d product(s)?', count($toProcess)),
            true
        )) {
            $this->warn('Aborted by user.');
            return self::SUCCESS;
        }

        // ─── Apply deductions ───
        $this->info('');
        $this->line('─── Applying deductions ───');

        $success = 0;
        $failed  = 0;

        foreach ($toProcess as $product) {
            try {
                $result = $this->deductProduct($product, $calculator, $userId);
                $success++;
                $this->info(sprintf(
                    '  ✅ [%d] %s — %d material(s) deducted',
                    $product->id,
                    $product->name,
                    $result['materials_deducted']
                ));
            } catch (\Throwable $e) {
                $failed++;
                $this->error(sprintf(
                    '  ❌ [%d] %s — %s',
                    $product->id,
                    $product->name,
                    $e->getMessage()
                ));

                Log::error('[BACKFILL] Product deduction failed', [
                    'product_id'   => $product->id,
                    'product_name' => $product->name,
                    'error'        => $e->getMessage(),
                ]);
            }
        }

        // ─── Summary ───
        $this->info('');
        $this->info('═══════════════════════════════════════════════════════');
        $this->info(sprintf('  ✔ Complete: %d succeeded, %d failed', $success, $failed));
        $this->info('═══════════════════════════════════════════════════════');

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    /* ═══════════════════════════════════════════════════════════════
     *  Guard: has this product already been deducted?
     * ═══════════════════════════════════════════════════════════════ */

    /**
     * A product is considered "already deducted" if there is at least one
     * stock_history row that references it as a product-triggered change.
     *
     * The controller writes these rows with:
     *   reference_type = 'product'
     *   reference_id   = $product->id
     *
     * Any prior call to deductMaterialsForStock() — whether at create,
     * update, or a previous backfill — leaves at least one such row.
     */
    private function hasExistingDeduction(Product $product): bool
    {
        return StockHistory::where('reference_type', 'product')
            ->where('reference_id', $product->id)
            ->exists();
    }

    /* ═══════════════════════════════════════════════════════════════
     *  Per-unit material requirements — mirrors ProductController
     * ═══════════════════════════════════════════════════════════════ */

    /**
     * @return array{material_id: float}  [material_id => quantity per unit]
     */
    private function getPerUnitRequirements(
        Product $product,
        MaterialCalculationService $calculator
    ): array {
        if ($product->is_customizable) {
            $partsData = [];
            foreach ($product->parts as $part) {
                $partsData[$part->id] = [
                    'length'    => (float) ($part->standard_length    ?? $product->standard_length    ?? 0),
                    'width'     => (float) ($part->standard_width     ?? $product->standard_width     ?? 0),
                    'height'    => (float) ($part->standard_height    ?? $product->standard_height    ?? 0),
                    'thickness' => (float) ($part->standard_thickness ?? $product->standard_thickness ?? 0),
                    'diameter'  => (float) ($part->standard_diameter  ?? $product->standard_diameter  ?? 0),
                    'depth'     => (float) ($part->standard_depth     ?? $product->standard_depth     ?? 0),
                ];
            }

            return $calculator->calculateRequirements($product, $partsData);
        }

        $perUnit = [];
        foreach ($product->materials as $material) {
            $perUnit[$material->id] = (float) $material->pivot->quantity;
        }
        return $perUnit;
    }

    /* ═══════════════════════════════════════════════════════════════
     *  Apply deduction for a single product
     * ═══════════════════════════════════════════════════════════════ */

    /**
     * @return array{materials_deducted: int}
     */
    private function deductProduct(
        Product $product,
        MaterialCalculationService $calculator,
        ?int $userId
    ): array {
        $perUnit = $this->getPerUnitRequirements($product, $calculator);

        $deductedCount = 0;

        DB::transaction(function () use ($product, $perUnit, $userId, &$deductedCount) {
            foreach ($product->materials as $material) {
                $qtyPerUnit = (float) ($perUnit[$material->id] ?? 0);
                if ($qtyPerUnit <= 0) {
                    continue;
                }

                $required = $qtyPerUnit * $product->stock_quantity;

                // Lock the row so concurrent operations can't race
                $fresh    = Material::lockForUpdate()->findOrFail($material->id);
                $previous = (float) $fresh->stock_quantity;
                $new      = $previous - $required;

                if ($new < 0) {
                    throw new \RuntimeException(sprintf(
                        'Insufficient stock for "%s": need %s %s, have %s %s',
                        $fresh->name,
                        number_format($required, 4),
                        $fresh->unit ?? 'unit',
                        number_format($previous, 4),
                        $fresh->unit ?? 'unit'
                    ));
                }

                $fresh->stock_quantity = $new;
                $fresh->save();

                StockHistory::create([
                    'material_id'       => $fresh->id,
                    'quantity_change'   => -$required,
                    'previous_quantity' => $previous,
                    'new_quantity'      => $new,
                    'note'              => sprintf(
                        "Backfill: initial stock for '%s' (%d units) — customizable product fix",
                        $product->name,
                        $product->stock_quantity
                    ),
                    'created_by'        => $userId,
                    'reference_type'    => 'product',
                    'reference_id'      => $product->id,
                ]);

                $deductedCount++;

                Log::info('[BACKFILL] Material deducted', [
                    'product_id'   => $product->id,
                    'product_name' => $product->name,
                    'material_id'  => $fresh->id,
                    'material'     => $fresh->name,
                    'required'     => $required,
                    'previous'     => $previous,
                    'new'          => $new,
                ]);
            }
        });

        return ['materials_deducted' => $deductedCount];
    }
}
