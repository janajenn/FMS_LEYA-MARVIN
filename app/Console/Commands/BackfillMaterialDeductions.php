<?php

namespace App\Console\Commands;

use App\Models\Material;
use App\Models\Product;
use App\Models\StockHistory;
use App\Models\User;
use App\Services\MaterialCalculationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BackfillMaterialDeductions extends Command
{
    protected $signature = 'products:backfill-material-deductions
                            {--dry-run      : Preview what would be deducted without making changes}
                            {--product=     : Process only this product ID}
                            {--user-id=     : User ID to attribute these deductions to (auto-detects an admin if omitted)}
                            {--skip-short   : Skip products with insufficient material stock instead of failing them}
                            {--force        : Skip the confirmation prompt}';

    protected $description = 'Deduct raw materials for existing products whose deductions were never applied. Safe to run multiple times — products with existing stock_history rows are skipped.';

    private ?int $resolvedUserId = null;

    public function handle(MaterialCalculationService $calculator): int
    {
        $dryRun    = (bool) $this->option('dry-run');
        $productId = $this->option('product');
        $force     = (bool) $this->option('force');
        $skipShort = (bool) $this->option('skip-short');

        // ─── Resolve the user ID to attribute deductions to ───
        $this->resolvedUserId = $this->resolveUserId();
        if (!$this->resolvedUserId && !$dryRun) {
            $this->error('No user ID available. Pass --user-id=<id> or ensure an admin user exists.');
            return self::FAILURE;
        }

        $this->info('');
        $this->info('═══════════════════════════════════════════════════════');
        $this->info('  Material Deduction Backfill');
        $this->info('═══════════════════════════════════════════════════════');

        if ($dryRun) {
            $this->warn('  MODE: DRY RUN — no changes will be made');
        } else {
            $this->warn('  MODE: LIVE — materials will be deducted');
            $this->line('  Attributed to user ID: ' . $this->resolvedUserId);
        }

        if ($productId) {
            $this->line('  Scope: single product #' . $productId);
        }
        if ($skipShort) {
            $this->line('  Short products: will be SKIPPED (not failed)');
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

        // ─── Classify ───
        $toProcess = [];
        $skipped   = [];

        foreach ($products as $product) {
            if ($this->hasExistingDeduction($product)) {
                $skipped[] = $product;
                continue;
            }
            if ($product->materials->isEmpty()) {
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

        // ─── Preview ───
        $this->line('─── Products to process ───');

        $shortProducts = [];

        foreach ($toProcess as $product) {
            $perUnit = $this->getPerUnitRequirements($product, $calculator);
            $isShort = false;

            $this->line(sprintf(
                '  [%d] %s  (customizable=%s, stock=%d)',
                $product->id,
                $product->name,
                $product->is_customizable ? 'yes' : 'no',
                $product->stock_quantity
            ));

            foreach ($product->materials as $material) {
                $qty = (float) ($perUnit[$material->id] ?? 0);
                if ($qty <= 0) continue;

                $total     = $qty * $product->stock_quantity;
                $available = (float) $material->stock_quantity;
                $after     = $available - $total;

                if ($after < 0) {
                    $isShort = true;
                    $status = sprintf('⚠️  SHORT by %s', number_format(abs($after), 2));
                } else {
                    $status = sprintf('→ %s after', number_format($after, 2));
                }

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
            }

            if ($isShort) {
                $shortProducts[] = $product->id;
            }
        }

        if ($dryRun) {
            $this->info('');
            if (!empty($shortProducts)) {
                $this->warn('  ⚠️  These products are SHORT on materials and would fail: '
                    . implode(', ', $shortProducts));
            }
            $this->info('✔ Dry run complete. No changes were made.');
            $this->line('   Re-run without --dry-run to apply.');
            return self::SUCCESS;
        }

        // ─── Confirm ───
        $this->info('');
        if (!$force && !$this->confirm(
            sprintf('Proceed with deductions for %d product(s)?', count($toProcess)),
            true
        )) {
            $this->warn('Aborted by user.');
            return self::SUCCESS;
        }

        // ─── Apply ───
        $this->info('');
        $this->line('─── Applying deductions ───');

        $success       = 0;
        $failed        = 0;
        $skippedShort  = 0;
        $errors        = [];

        foreach ($toProcess as $product) {
            try {
                $result = $this->deductProduct($product, $calculator);
                $success++;
                $this->info(sprintf(
                    '  ✅ [%d] %s — %d material(s) deducted',
                    $product->id,
                    $product->name,
                    $result['materials_deducted']
                ));
            } catch (\RuntimeException $e) {
                // Insufficient-stock case
                if ($skipShort) {
                    $skippedShort++;
                    $this->warn(sprintf(
                        '  ⏭️  [%d] %s — SKIPPED (short on materials): %s',
                        $product->id,
                        $product->name,
                        $e->getMessage()
                    ));
                } else {
                    $failed++;
                    $errors[] = "Product {$product->id} ({$product->name}): {$e->getMessage()}";
                    $this->error(sprintf(
                        '  ❌ [%d] %s — %s',
                        $product->id,
                        $product->name,
                        $e->getMessage()
                    ));
                }
            } catch (\Throwable $e) {
                $failed++;
                $errors[] = "Product {$product->id} ({$product->name}): {$e->getMessage()}";
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
        $this->info(sprintf(
            '  ✔ %d succeeded, %d skipped (short), %d failed',
            $success,
            $skippedShort,
            $failed
        ));
        $this->info('═══════════════════════════════════════════════════════');

        if (!empty($errors)) {
            $this->info('');
            $this->warn('  Failed products (fix data, then re-run):');
            foreach ($errors as $err) {
                $this->line('    · ' . $err);
            }
        }

        if ($skippedShort > 0) {
            $this->info('');
            $this->warn('  Skipped products (restock materials, then re-run):');
            foreach ($shortProducts as $pid) {
                $this->line('    · Product #' . $pid);
            }
        }

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    /* ═══════════════════════════════════════════════════════════════
     *  User resolution — auto-detect an admin if none is supplied
     * ═══════════════════════════════════════════════════════════════ */

    private function resolveUserId(): ?int
    {
        $explicit = $this->option('user-id');
        if ($explicit) {
            return (int) $explicit;
        }

        // Find the first admin user
        $admin = User::whereHas('role', fn ($q) => $q->where('slug', 'admin'))
            ->orderBy('id')
            ->first();

        return $admin?->id;
    }

    /* ═══════════════════════════════════════════════════════════════
     *  Idempotency guard
     * ═══════════════════════════════════════════════════════════════ */

    private function hasExistingDeduction(Product $product): bool
    {
        return StockHistory::where('reference_type', 'product')
            ->where('reference_id', $product->id)
            ->exists();
    }

    /* ═══════════════════════════════════════════════════════════════
     *  Per-unit material requirements
     * ═══════════════════════════════════════════════════════════════ */

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

    private function deductProduct(
        Product $product,
        MaterialCalculationService $calculator
    ): array {
        $perUnit = $this->getPerUnitRequirements($product, $calculator);
        $deductedCount = 0;

        DB::transaction(function () use ($product, $perUnit, &$deductedCount) {
            foreach ($product->materials as $material) {
                $qtyPerUnit = (float) ($perUnit[$material->id] ?? 0);
                if ($qtyPerUnit <= 0) {
                    continue;
                }

                $required = $qtyPerUnit * $product->stock_quantity;

                $fresh    = Material::lockForUpdate()->findOrFail($material->id);
                $previous = (float) $fresh->stock_quantity;
                $new      = $previous - $required;

                if ($new < 0) {
                    // Throwing here rolls the whole product back
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
                    'created_by'        => $this->resolvedUserId,
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
                    'user_id'      => $this->resolvedUserId,
                ]);
            }
        });

        return ['materials_deducted' => $deductedCount];
    }
}
