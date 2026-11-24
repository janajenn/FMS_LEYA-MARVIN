<?php

namespace App\Services;

use App\Models\Material;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\StockHistory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class OrderMaterialService
{
    protected MaterialRequirementCalculator $calculator;

    public function __construct(?MaterialRequirementCalculator $calculator = null)
    {
        $this->calculator = $calculator ?? new MaterialRequirementCalculator();
    }

    /**
     * Deduct materials for an entire order (public compatibility API).
     */
    public function deductForOrder(Order $order): void
    {
        $order->loadMissing(['items.product.parts', 'items.variant.material']);

        foreach ($order->items as $item) {
            $this->processOrderItemMaterials(
                $item,
                $item->product,
                $item->customization_data ?? []
            );
        }
    }

    /**
     * Public entry point for a single order item.
     * Called by PaymentController@success and WebhookController@handlePaymentPaid.
     *
     * Phase 3 behavior:
     *   1. If the item is a standard configuration AND stock is available,
     *      consume units from products.stock_quantity first.
     *   2. For any remaining units (either non-standard order, or stock
     *      insufficient), deduct raw materials as before.
     *   3. Never both, for the same physical unit.
     */
    public function processOrderItemMaterials(
        OrderItem $orderItem,
        Product $product,
        array $customizationData = []
    ): void {
        $order = $orderItem->relationLoaded('order') && $orderItem->order
            ? $orderItem->order
            : Order::find($orderItem->order_id);

        if (!$order) {
            Log::warning('[ORDER DEDUCT] No order found for order item', [
                'order_item_id' => $orderItem->id,
            ]);
            return;
        }

        // Ensure required relations are loaded
        $product->loadMissing(['parts.designs', 'materials', 'finishMaterial']);
        $orderItem->loadMissing('variant.material');

        // Persist incoming customization_data if not already saved
        if (empty($orderItem->customization_data) && !empty($customizationData)) {
            $orderItem->customization_data = $customizationData;
        }

        $data             = $orderItem->customization_data ?? [];
        $partsData        = $this->normalizePartsData($data);
        $finishOption     = $data['finish_option'] ?? $orderItem->finish_option ?? 'ordinary';
        $variantMaterial  = $orderItem->variant?->material_id;
        $qtyOrdered       = (int) $orderItem->quantity;

        // ═══════════════════════════════════════════════════════════════
        //  STEP 1 — Try to satisfy from finished-goods stock
        // ═══════════════════════════════════════════════════════════════
        $stockConsumed   = 0;
        $materialsToMake = $qtyOrdered;

        if ($this->isStandardConfiguration($product, $partsData, $finishOption)) {
            // Lock the product row to serialize concurrent orders + production
            // (matches the lock order in ProductionService: product first, then materials)
            $lockedProduct = Product::where('id', $product->id)
                ->lockForUpdate()
                ->first();

            if ($lockedProduct && (int) $lockedProduct->stock_quantity > 0) {
                $stockConsumed   = min($qtyOrdered, (int) $lockedProduct->stock_quantity);
                $materialsToMake = $qtyOrdered - $stockConsumed;

                if ($stockConsumed > 0) {
                    $stockBefore = (int) $lockedProduct->stock_quantity;
                    $lockedProduct->stock_quantity = $stockBefore - $stockConsumed;
                    $lockedProduct->save();

                    Log::info('[ORDER DEDUCT] Consumed from finished stock', [
                        'order_item_id'  => $orderItem->id,
                        'order_id'       => $order->id,
                        'product_id'     => $product->id,
                        'variant_id'     => $orderItem->variant_id,
                        'qty_ordered'    => $qtyOrdered,
                        'from_stock'     => $stockConsumed,
                        'materials_make' => $materialsToMake,
                        'stock_before'   => $stockBefore,
                        'stock_after'    => $lockedProduct->stock_quantity,
                    ]);
                }
            }
        }

        // Fully satisfied from stock — no material deduction needed
        if ($materialsToMake === 0) {
            $orderItem->calculated_materials = [[
                'source' => 'finished_goods',
                'qty'    => $stockConsumed,
                'note'   => 'Consumed from finished stock — no material deduction',
            ]];
            $orderItem->save();

            Log::info('[ORDER DEDUCT] Fully satisfied from stock', [
                'order_item_id' => $orderItem->id,
                'qty'           => $stockConsumed,
            ]);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        //  STEP 2 — Deduct raw materials for remaining units
        // ═══════════════════════════════════════════════════════════════
        Log::info('[ORDER DEDUCT] Starting material deduction', [
            'order_item_id'       => $orderItem->id,
            'product_id'          => $product->id,
            'variant_material_id' => $variantMaterial,
            'finish_option'       => $finishOption,
            'part_count'          => count($partsData),
            'qty_ordered'         => $qtyOrdered,
            'from_stock'          => $stockConsumed,
            'materials_to_make'   => $materialsToMake,
        ]);

        $requirements = $this->calculator->calculateForUnit(
            $product,
            $partsData,
            $variantMaterial,
            $finishOption
        );

        if (empty($requirements)) {
            Log::warning('[ORDER DEDUCT] No material requirements produced', [
                'order_item_id' => $orderItem->id,
                'product_id'    => $product->id,
            ]);
            $orderItem->calculated_materials = [];
            $orderItem->save();
            return;
        }

        $snapshot = [];

        // Audit entry for the stock portion (keeps one snapshot per item)
        if ($stockConsumed > 0) {
            $snapshot[] = [
                'source' => 'finished_goods',
                'qty'    => $stockConsumed,
                'note'   => 'From stock',
            ];
        }

        foreach ($requirements as $materialId => $qtyPerUnit) {
            if ($qtyPerUnit <= 0) continue;

            // ← CHANGED: multiply by remaining units to make, not total ordered
            $totalQty = $qtyPerUnit * $materialsToMake;
            $material = Material::find($materialId);
            if (!$material) {
                Log::warning('[ORDER DEDUCT] Material not found', ['material_id' => $materialId]);
                continue;
            }

            $this->deductStock(
                $material,
                $totalQty,
                $order,
                "Order #{$order->order_number} — {$product->name}"
            );

            $snapshot[] = [
                'material_id'   => $materialId,
                'material_name' => $material->name,
                'qty'           => round($totalQty, 4),
                'source'        => 'materials',
            ];
        }

        $orderItem->calculated_materials = $snapshot;
        $orderItem->save();

        Log::info('[ORDER DEDUCT] Snapshot saved', [
            'order_item_id' => $orderItem->id,
            'materials'     => $snapshot,
        ]);
    }

    /**
     * Public: is this customization_data the same configuration that a
     * production run would have produced?
     *
     * Used by OrderMaterialService (Phase 3 stock consumption) and by
     * CheckoutController's pre-check so the two never disagree.
     *
     * Two conditions must hold:
     *   1. Finish matches what production uses.
     *   2. Every enabled dimension is at its standard value, and every
     *      design is the default one.
     */
    public function isStandardConfiguration(
        Product $product,
        array $partsData,
        string $finishOption
    ): bool {
        // Finish must match the product's own production finish
        $productionFinish = $product->finish_material_id ? 'standard' : 'ordinary';
        if ($finishOption !== $productionFinish) {
            return false;
        }

        $product->loadMissing(['parts.designs']);

        foreach ($product->parts as $part) {
            $pData = $partsData[$part->id] ?? [];

            // Every enabled dimension field must equal its standard value
            foreach ($part->dimension_fields ?? [] as $field) {
                $std    = $part->{"standard_{$field}"};
                $custom = $pData[$field] ?? null;

                if ($std === null && $custom === null) {
                    continue; // nothing set either way — OK
                }
                if ($std === null || $custom === null) {
                    return false; // partial — not standard
                }
                if (abs((float) $custom - (float) $std) > 0.01) {
                    return false; // dimension changed
                }
            }

            // Design must be default (or absent)
            $designId = $pData['design_id'] ?? null;
            if ($designId !== null) {
                $default = $part->designs->firstWhere('is_default', true);
                if (!$default || (int) $designId !== (int) $default->id) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Normalize customization_data to flat [part_id => dims].
     * Handles BOTH:
     *   { parts: { 11: {...}, 12: {...} }, finish_option: 'standard' }
     *   { 11: {...}, 12: {...}, finish_option: 'standard' }
     */
    protected function normalizePartsData(array $data): array
    {
        if (!empty($data['parts']) && is_array($data['parts'])) {
            return $data['parts'];
        }

        $result = [];
        foreach ($data as $key => $value) {
            if (is_numeric($key) && is_array($value)) {
                $result[$key] = $value;
            }
        }
        return $result;
    }

    /**
     * Deduct stock and write audit trail.
     * Allows negative stock — pre-check blocks ahead of time; this is the
     * safety net for concurrent orders that race past the check.
     */
    protected function deductStock(Material $material, float $qty, Order $order, string $reason): void
    {
        $previous = (float) $material->stock_quantity;
        $new      = $previous - $qty;

        if ($new < 0) {
            Log::warning('[ORDER DEDUCT] Negative stock', [
                'order_id'  => $order->id,
                'material'  => $material->name,
                'previous'  => $previous,
                'deducted'  => $qty,
                'new'       => $new,
            ]);
        }

        $material->stock_quantity = $new;
        $material->save();

        StockHistory::create([
            'material_id'       => $material->id,
            'quantity_change'   => -$qty,
            'previous_quantity' => $previous,
            'new_quantity'      => $new,
            'note'              => $reason,
            'created_by'        => Auth::id() ?? 1,
            'reference_type'    => 'order',
            'reference_id'      => $order->id,
        ]);

        Log::info('[ORDER DEDUCT] Material deducted', [
            'order_id'    => $order->id,
            'material_id' => $material->id,
            'material'    => $material->name,
            'qty'         => round($qty, 4),
            'previous'    => $previous,
            'new'         => $new,
        ]);
    }
}
