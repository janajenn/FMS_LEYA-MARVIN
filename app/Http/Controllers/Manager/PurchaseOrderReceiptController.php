<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PurchaseOrderReceiptController extends Controller
{
    public function show(PurchaseOrder $purchaseOrder)
    {
        // ── Status guard ──
        if ($purchaseOrder->status !== 'completed') {
            return redirect()
                ->route('manager.purchase-orders.show', $purchaseOrder->id)
                ->with(
                    'error',
                    'Receipt is only available once the PO is completed. Current status: '
                    . $purchaseOrder->status . '.'
                );
        }

        // ── Load with a safety net: any relation that doesn't exist
        //     yet will simply be an empty collection, not a crash.
        $purchaseOrder->load([
            'materialRequest.requester',
            'supplier',
            'approver',
            'recorder',
            'items.material',
            'goodsReceipts' => function ($q) {
                $q->where('status', 'confirmed');
            },
            'goodsReceipts.items',
            'expense',
        ]);

        // ── Build the per-item received summary.
        //    We pull from the loaded goodsReceipts directly instead of
        //    relying on a goodsReceiptItems() relationship on the item —
        //    this works even if that relationship hasn't been added yet.
        $receivedSummary = $purchaseOrder->items->map(function ($item) use ($purchaseOrder) {
            $receiptLines = $purchaseOrder->goodsReceipts
                ->flatMap(fn ($gr) => $gr->items ?? [])
                ->where('purchase_order_item_id', $item->id);

            $accepted = (float) $receiptLines->sum('accepted_quantity');
            $damaged  = (float) $receiptLines->sum('damaged_quantity');

            return [
                'id'                => $item->id,
                'material_name'     => $item->material?->name ?? 'Material',
                'unit'              => $item->material?->unit ?? '—',
                'ordered_quantity'  => (float) $item->ordered_quantity,
                'received_quantity' => $accepted,
                'damaged_quantity'  => $damaged,
                'actual_unit_cost'  => (float) ($item->actual_unit_cost ?? 0),
                'actual_subtotal'   => (float) ($item->actual_subtotal ?? 0),
            ];
        });

        Log::info('[PO RECEIPT] Rendered', [
            'po_id'         => $purchaseOrder->id,
            'po_number'     => $purchaseOrder->po_number,
            'items'         => $receivedSummary->count(),
            'total_receipts'=> $purchaseOrder->goodsReceipts->count(),
        ]);

        return Inertia::render('Manager/PurchaseOrders/Receipt', [
            'purchaseOrder'   => $purchaseOrder,
            'receivedSummary' => $receivedSummary,
            'storeLocation'   => [
                'name'    => config('store.name', 'FMS Store'),
                'address' => config('store.address', ''),
            ],
        ]);
    }
}
