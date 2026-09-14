<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Material;
use App\Models\StockHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderMaterialService
{
    protected MaterialCalculationService $calculator;

    public function __construct(MaterialCalculationService $calculator)
    {
        $this->calculator = $calculator;
    }

    /**
     * Process material calculation and deduction for a single order item.
     */
   public function processOrderItemMaterials(OrderItem $orderItem, Product $product, array $customizationData): void
{
    Log::info('[MATERIAL_DEDUCTION] Started processing order item', [
        'order_item_id' => $orderItem->id,
        'order_id' => $orderItem->order_id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'is_customizable' => $product->is_customizable,
        'quantity' => $orderItem->quantity,
        'customization_data' => $customizationData,
    ]);

    // Prevent double deduction
    if (!empty($orderItem->calculated_materials)) {
        Log::info('[MATERIAL_DEDUCTION] Skipping – materials already deducted', [
            'order_item_id' => $orderItem->id,
        ]);
        return;
    }

    $requirements = [];

    // Determine if we have parts data (either under 'parts' key or as numeric keys)
    $partsData = [];
    if (!empty($customizationData['parts'])) {
        $partsData = $customizationData['parts'];
    } else {
        // Check for numeric keys (part IDs) at top level, excluding non‑part keys like 'finish_id'
        foreach ($customizationData as $key => $value) {
            if (is_numeric($key) && is_array($value)) {
                $partsData[$key] = $value;
            }
        }
    }

    // 1. Handle customizable products with parts data
    if ($product->is_customizable && !empty($partsData)) {
        Log::info('[MATERIAL_DEDUCTION] Customizable product with parts data – using calculator', [
            'parts_data' => $partsData,
        ]);

        try {
            $requirements = $this->calculator->calculateRequirements($product, $partsData);
            Log::info('[MATERIAL_DEDUCTION] Calculator returned requirements', [
                'requirements' => $requirements,
            ]);
        } catch (\Exception $e) {
            Log::error('[MATERIAL_DEDUCTION] Calculator failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
    // 2. Handle non‑customizable OR customizable without parts (use fixed BOM)
    else {
        Log::info('[MATERIAL_DEDUCTION] Using fixed BOM from product_materials');
        $requirements = $this->getFixedRequirements($product, $orderItem->quantity);
        Log::info('[MATERIAL_DEDUCTION] Fixed requirements calculated', [
            'requirements' => $requirements,
        ]);
    }

    // If no materials are required, skip
    if (empty($requirements)) {
        Log::info('[MATERIAL_DEDUCTION] No materials required – saving empty calculated_materials');
        $orderItem->calculated_materials = [];
        $orderItem->save();
        return;
    }


        // Store calculated materials on order item
        Log::info('[MATERIAL_DEDUCTION] Saving calculated_materials to order item');
        $orderItem->calculated_materials = $requirements;
        $orderItem->save();

        // Deduct from inventory
        $this->deductMaterials($requirements, $orderItem);
    }

    /**
     * Get fixed material requirements from product_materials pivot.
     */
    protected function getFixedRequirements(Product $product, int $quantity): array
    {
        Log::info('[MATERIAL_DEDUCTION] Fetching fixed BOM for product', [
            'product_id' => $product->id,
        ]);

        $requirements = [];
        foreach ($product->materials as $material) {
            $pivot = $material->pivot;
            Log::info('[MATERIAL_DEDUCTION] Processing pivot entry', [
                'material_id' => $material->id,
                'material_name' => $material->name,
                'calculation_type' => $pivot->calculation_type,
                'pivot_quantity' => $pivot->quantity,
                'order_quantity' => $quantity,
            ]);

            // Only use fixed quantity; if calculation_type is 'calculated', we skip (not supported here)
            if ($pivot->calculation_type === 'fixed') {
                $qty = $pivot->quantity * $quantity;
                $requirements[$material->id] = $qty;
                Log::info('[MATERIAL_DEDUCTION] Added fixed material requirement', [
                    'material_id' => $material->id,
                    'quantity' => $qty,
                ]);
            } else {
                Log::info('[MATERIAL_DEDUCTION] Skipping non‑fixed material (calculation_type = calculated)', [
                    'material_id' => $material->id,
                ]);
            }
        }

        return $requirements;
    }

    /**
     * Deduct materials and log stock history.
     */
    protected function deductMaterials(array $requirements, OrderItem $orderItem): void
    {
        Log::info('[MATERIAL_DEDUCTION] Starting stock deduction', [
            'requirements' => $requirements,
        ]);

        foreach ($requirements as $materialId => $quantity) {
            if ($quantity <= 0) {
                Log::info('[MATERIAL_DEDUCTION] Skipping zero/negative quantity', [
                    'material_id' => $materialId,
                    'quantity' => $quantity,
                ]);
                continue;
            }

            Log::info('[MATERIAL_DEDUCTION] Processing material', [
                'material_id' => $materialId,
                'required_quantity' => $quantity,
            ]);

            try {
                $material = Material::findOrFail($materialId);
                $previousQty = $material->stock_quantity;
                $newQty = $previousQty - $quantity;

                Log::info('[MATERIAL_DEDUCTION] Stock before deduction', [
                    'material_id' => $materialId,
                    'material_name' => $material->name,
                    'previous_stock' => $previousQty,
                    'new_stock' => $newQty,
                ]);

                if ($newQty < 0) {
                    $error = "Insufficient stock for material '{$material->name}'. Required: {$quantity}, Available: {$previousQty}";
                    Log::error('[MATERIAL_DEDUCTION] Insufficient stock', [
                        'material_id' => $materialId,
                        'required' => $quantity,
                        'available' => $previousQty,
                    ]);
                    throw new \Exception($error);
                }

                // Update stock
                $material->stock_quantity = $newQty;
                $material->save();

                Log::info('[MATERIAL_DEDUCTION] Stock updated', [
                    'material_id' => $materialId,
                    'new_stock' => $newQty,
                ]);

                // Record stock history
                try {
                    $history = StockHistory::create([
                        'material_id' => $material->id,
                        'quantity_change' => -$quantity,
                        'previous_quantity' => $previousQty,
                        'new_quantity' => $newQty,
                        'note' => "Order #{$orderItem->order->order_number} – used for production (Item ID: {$orderItem->id})",
                        'created_by' => auth()->id(),
                        'reference_type' => 'order_item',
                        'reference_id' => $orderItem->id,
                    ]);

                    Log::info('[MATERIAL_DEDUCTION] StockHistory record created', [
                        'stock_history_id' => $history->id,
                        'material_id' => $materialId,
                    ]);
                } catch (\Exception $e) {
                    Log::error('[MATERIAL_DEDUCTION] Failed to create StockHistory', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    throw $e;
                }

            } catch (\Exception $e) {
                Log::error('[MATERIAL_DEDUCTION] Exception during deduction', [
                    'material_id' => $materialId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw $e;
            }
        }

        Log::info('[MATERIAL_DEDUCTION] Deduction completed successfully for order item', [
            'order_item_id' => $orderItem->id,
        ]);
    }
}
