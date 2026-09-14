<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function index()
    {
        $orders = PurchaseOrder::with(['supplier', 'materialRequest.requester'])
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('Admin/Procurement/PurchaseOrders/Index', ['orders' => $orders]);
    }

public function show(PurchaseOrder $purchaseOrder)
{
    $purchaseOrder->load([
        'items.material.category',
        'items.goodsReceiptItems',
        'supplier',
        'materialRequest.requester',
        'goodsReceipts.receiver',
        'goodsReceipts.items.purchaseOrderItem.material',
    ]);

    // ✅ Has remaining quantity for regular delivery
    $hasRemaining = $purchaseOrder->items->sum(function ($item) {
        return $item->remaining_quantity;
    }) > 0;

    // ✅ Has replacement approved and pending
    $hasReplacementPending = $purchaseOrder->items->sum('replacement_quantity') > 0;

    // ✅ Has damaged items that are NOT yet requested (replacement_quantity == 0)
    $hasDamagedItems = $purchaseOrder->items->filter(function ($item) {
        return ($item->damaged_quantity ?? 0) > 0 && ($item->replacement_quantity ?? 0) == 0;
    })->count() > 0;

    return Inertia::render('Admin/Procurement/PurchaseOrders/Show', [
        'order' => $purchaseOrder,
        'hasRemaining' => $hasRemaining,
        'hasReplacementPending' => $hasReplacementPending,
        'hasDamagedItems' => $hasDamagedItems,
    ]);
}


}
