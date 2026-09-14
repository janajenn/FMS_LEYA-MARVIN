<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReplacementReceiptController extends Controller
{
    public function create(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['items.material', 'supplier']);

        // Check if there are replacement items
        $hasReplacement = $purchaseOrder->items->sum('replacement_quantity') > 0;
        if (!$hasReplacement) {
            return redirect()->route('admin.purchase-orders.show', $purchaseOrder->id)
                ->with('error', 'No replacement items pending for this purchase order.');
        }

        return Inertia::render('Admin/Procurement/ReplacementReceipt/Create', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    public function store(Request $request, PurchaseOrder $purchaseOrder)
    {
        $validated = $request->validate([
            'received_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.po_item_id' => 'required|exists:purchase_order_items,id',
            'items.*.replacement_quantity' => 'required|numeric|min:0.01',
        ]);

        $purchaseOrder->load('items');

        DB::transaction(function () use ($validated, $purchaseOrder) {
            $gr = GoodsReceipt::create([
                'gr_number' => GoodsReceipt::generateGRNumber(),
                'purchase_order_id' => $purchaseOrder->id,
                'received_by' => Auth::id(),
                'received_date' => $validated['received_date'],
                'status' => 'pending_confirmation',
            ]);

            foreach ($validated['items'] as $itemData) {
                $poItem = PurchaseOrderItem::find($itemData['po_item_id']);

                // Validate replacement quantity
                if ($itemData['replacement_quantity'] > $poItem->replacement_quantity) {
                    throw new \Exception("Replacement quantity exceeds remaining replacement for: {$poItem->material->name}");
                }

                // Deduct from replacement quantity
                $poItem->replacement_quantity -= $itemData['replacement_quantity'];
                $poItem->save();

                // Create goods receipt item (replacements are always in good condition)
                GoodsReceiptItem::create([
                    'goods_receipt_id' => $gr->id,
                    'purchase_order_item_id' => $poItem->id,
                    'received_quantity' => $itemData['replacement_quantity'],
                    'accepted_quantity' => $itemData['replacement_quantity'],
                    'damaged_quantity' => 0,
                    'condition' => 'good',
                    'damage_reason' => null,
                ]);

                // Update inventory
                $material = $poItem->material;
                $material->stock_quantity += $itemData['replacement_quantity'];
                $material->save();

                // Log stock history
                StockHistory::create([
                    'material_id' => $material->id,
                    'reference_type' => 'replacement_receipt',
                    'reference_id' => $gr->id,
                    'quantity_change' => $itemData['replacement_quantity'],
                    'previous_quantity' => $material->stock_quantity - $itemData['replacement_quantity'],
                    'new_quantity' => $material->stock_quantity,
                    'note' => "Replacement receipt #{$gr->gr_number} for PO #{$purchaseOrder->po_number}",
                    'created_by' => Auth::id(),
                ]);
            }

            // Update PO status
           $purchaseOrder->updateStatus();
        });

        return redirect()->route('admin.purchase-orders.show', $purchaseOrder->id)
            ->with('success', 'Replacement receipt created. Awaiting manager confirmation.');
    }


}
