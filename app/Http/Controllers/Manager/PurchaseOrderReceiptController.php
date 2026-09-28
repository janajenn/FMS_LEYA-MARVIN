<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Inertia\Inertia;

class PurchaseOrderReceiptController extends Controller
{
    public function show(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'completed') {
            abort(404, 'Receipt is only available for completed purchase orders.');
        }

        $purchaseOrder->load([
            'materialRequest.requester',
            'supplier',
            'approver',
            'recorder',
            'items.material',
            'goodsReceipts' => function ($q) {
                $q->where('status', 'confirmed')->with(['receiver', 'confirmer']);
            },
            'expense',
        ]);

        $receivedSummary = $purchaseOrder->items->map(function ($item) {
            $accepted = $item->goodsReceiptItems->sum('accepted_quantity');
            $damaged  = $item->goodsReceiptItems->sum('damaged_quantity');

            return [
                'id'                => $item->id,
                'material_name'     => $item->material?->name,
                'unit'              => $item->material?->unit,
                'ordered_quantity'  => (float) $item->ordered_quantity,
                'received_quantity' => (float) $accepted,
                'damaged_quantity'  => (float) $damaged,
                'actual_unit_cost'  => (float) $item->actual_unit_cost,
                'actual_subtotal'   => (float) $item->actual_subtotal,
            ];
        });

        return Inertia::render('Manager/PurchaseOrders/Receipt', [
            'purchaseOrder'    => $purchaseOrder,
            'receivedSummary'  => $receivedSummary,
            'storeLocation'    => [
                'name'    => config('store.name', 'FMS Store'),
                'address' => config('store.address', ''),
            ],
        ]);
    }
}
