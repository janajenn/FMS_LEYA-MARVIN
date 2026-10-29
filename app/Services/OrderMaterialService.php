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
        $product->loadMissing(['parts', 'materials', 'finishMaterial']);
        $orderItem->loadMissing('variant.material');

        // Persist incoming customization_data if not already saved
        if (empty($orderItem->customization_data) && !empty($customizationData)) {
            $orderItem->customization_data = $customizationData;
        }

        $data             = $orderItem->customization_data ?? [];
        $partsData        = $this->normalizePartsData($data);
        $finishOption     = $data['finish_option'] ?? $orderItem->finish_option ?? 'ordinary';
        $variantMaterial  = $orderItem->variant?->material_id;

        Log::info('[ORDER DEDUCT] Starting deduction', [
            'order_item_id'        => $orderItem->id,
            'product_id'           => $product->id,
            'variant_material_id'  => $variantMaterial,
            'finish_option'        => $finishOption,
            'part_count'           => count($partsData),
            'quantity'             => $orderItem->quantity,
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
        foreach ($requirements as $materialId => $qtyPerUnit) {
            if ($qtyPerUnit <= 0) continue;

            $totalQty = $qtyPerUnit * $orderItem->quantity;
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
