<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function index()
    {
        $purchaseOrders = PurchaseOrder::with(['supplier', 'materialRequest', 'recorder'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Manager/PurchaseOrders/Index', [
            'purchaseOrders' => $purchaseOrders,
        ]);
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load([
            'materialRequest.requester',
            'supplier',
            'approver',
            'recorder',
            'items.material',
            'goodsReceipts',
            'expense',
        ]);

        return Inertia::render('Manager/PurchaseOrders/Show', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }
}
