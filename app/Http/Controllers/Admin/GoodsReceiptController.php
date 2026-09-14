<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\StockHistory;
use App\Events\Procurement\GoodsReceiptCreated;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GoodsReceiptController extends Controller
{
    /**
     * Show the form for receiving materials against a purchase order.
     */
    public function create(PurchaseOrder $purchaseOrder)
    {
        // Ensure PO is not completed or cancelled
        if (in_array($purchaseOrder->status, ['completed', 'cancelled'])) {
            return redirect()->route('admin.purchase-orders.index')
                ->with('error', 'This purchase order is already completed or cancelled.');
        }

        $purchaseOrder->load(['items.material.category', 'supplier']);
        return Inertia::render('Admin/Procurement/GoodsReceipt/Create', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    /**
     * Store a new goods receipt.
     */
    public function store(Request $request, PurchaseOrder $purchaseOrder)
{
    // ✅ Validate with damaged_quantity included
    $validated = $request->validate([
        'received_date' => 'required|date',
        'items' => 'required|array|min:1',
        'items.*.po_item_id' => 'required|exists:purchase_order_items,id',
        'items.*.received_quantity' => 'required|numeric|min:0.01',
        'items.*.condition' => 'required|in:good,damaged',
        'items.*.damaged_quantity' => 'nullable|numeric|min:0',
        'items.*.damage_reason' => 'required_if:items.*.condition,damaged|nullable|string',
    ]);

    $purchaseOrder->load('items');

    DB::transaction(function () use ($validated, $purchaseOrder) {
        // Create Goods Receipt
        $gr = GoodsReceipt::create([
            'gr_number' => GoodsReceipt::generateGRNumber(),
            'purchase_order_id' => $purchaseOrder->id,
            'received_by' => Auth::id(),
            'received_date' => $validated['received_date'],
            'status' => 'pending_confirmation',
        ]);

        foreach ($validated['items'] as $itemData) {
            $poItem = PurchaseOrderItem::find($itemData['po_item_id']);

            // Validate remaining quantity (accounting for accepted items only)
            $remaining = $poItem->ordered_quantity - $poItem->goodsReceiptItems->sum('accepted_quantity');
            if ($itemData['received_quantity'] > $remaining) {
                throw new \Exception("Received quantity ({$itemData['received_quantity']}) exceeds remaining ({$remaining}) for material: {$poItem->material->name}");
            }

            $received = $itemData['received_quantity'];
            $condition = $itemData['condition'];

            // ✅ Calculate damaged and accepted quantities
            if ($condition === 'damaged') {
                $damaged = $itemData['damaged_quantity'] ?? 0;
            } else {
                $damaged = 0;
            }

            // ✅ Validate: damaged cannot exceed received
            if ($damaged > $received) {
                throw new \Exception("Damaged quantity ({$damaged}) cannot exceed received quantity ({$received}) for {$poItem->material->name}.");
            }

            $accepted = $received - $damaged;

            // ✅ Create goods receipt item
            GoodsReceiptItem::create([
                'goods_receipt_id' => $gr->id,
                'purchase_order_item_id' => $poItem->id,
                'received_quantity' => $received,
                'accepted_quantity' => $accepted,
                'damaged_quantity' => $damaged,
                'condition' => $condition,
                'damage_reason' => $itemData['damage_reason'] ?? null,
            ]);

            // ❌ REMOVED: The automatic update of `replacement_quantity`.
            // It is now only updated when Manager approves a Replacement Request.
            // if ($damaged > 0) {
            //     $poItem->replacement_quantity += $damaged;
            //     $poItem->save();
            // }

            // ✅ Update inventory only for accepted quantity
            if ($accepted > 0) {
                $material = $poItem->material;
                $material->stock_quantity += $accepted;
                $material->save();

                // Log stock history
                StockHistory::create([
                    'material_id' => $material->id,
                    'reference_type' => 'goods_receipt',
                    'reference_id' => $gr->id,
                    'quantity_change' => $accepted,
                    'previous_quantity' => $material->stock_quantity - $accepted,
                    'new_quantity' => $material->stock_quantity,
                    'note' => "Goods Receipt #{$gr->gr_number}",
                    'created_by' => Auth::id(),
                ]);
            }
        }

        // ✅ Update PO status (will be `partially_delivered` if damage exists)
        $purchaseOrder->updateStatus();

    // ✅ Dispatch event
        event(new GoodsReceiptCreated($gr));
    });

    return redirect()->route('admin.purchase-orders.show', $purchaseOrder->id)
        ->with('success', 'Goods receipt created. Awaiting manager confirmation.');
}

    /**
 * Show the form to create a replacement request from a PO.
 */
public function createReplacementRequestForm(PurchaseOrder $purchaseOrder)
{
    $purchaseOrder->load([
        'goodsReceipts' => function ($q) {
            $q->where('status', 'confirmed');
        },
        'goodsReceipts.items.purchaseOrderItem.material',
        'supplier',
        'materialRequest'
    ]);

    $damagedItems = collect();

    foreach ($purchaseOrder->goodsReceipts as $gr) {
        foreach ($gr->items as $item) {
            if ($item->damaged_quantity > 0) {
                // Check if already requested/replaced
                $poItem = $item->purchaseOrderItem;
                // Only include if still pending (replacement_quantity is 0)
                if ($poItem->replacement_quantity == 0) {
                    $damagedItems->push([
                        'material_id' => $poItem->material_id,
                        'material_name' => $poItem->material->name,
                        'unit' => $poItem->material->unit,
                        'damaged_quantity' => $item->damaged_quantity,
                        'thickness' => $poItem->thickness,
                        'width' => $poItem->width,
                        'length' => $poItem->length,
                        'damage_reason' => $item->damage_reason,
                    ]);
                }
            }
        }
    }

    if ($damagedItems->isEmpty()) {
        return redirect()->route('admin.purchase-orders.show', $purchaseOrder->id)
            ->with('error', 'No pending damaged items to request replacement for.');
    }

    // Build prefill data for the material request create form
    $prefillData = [
        'procurement_type' => $purchaseOrder->materialRequest->procurement_type ?? 'supplier_purchase',
        'supplier_id' => $purchaseOrder->supplier_id,
        'reason' => "Replacement for damaged items from Purchase Order #{$purchaseOrder->po_number}",
        'items' => $damagedItems->map(function ($item) use ($purchaseOrder) {
            return [
                'material_id' => $item['material_id'],
                'quantity' => $item['damaged_quantity'],
                'thickness' => $item['thickness'],
                'width' => $item['width'],
                'length' => $item['length'],
                'notes' => "Damaged reason: {$item['damage_reason']}",
                'is_wood' => !empty($item['thickness']) || !empty($item['width']) || !empty($item['length']),
            ];
        })->toArray(),
        'reference_po' => $purchaseOrder->po_number,
        'type' => 'replacement',
        'purchase_order_id' => $purchaseOrder->id,
    ];

    session()->flash('replacement_prefill', $prefillData);

    return redirect()->route('admin.material-requests.create');
}
}
