<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\GoodsReceipt;
use Illuminate\Http\Request;
use App\Events\Procurement\GoodsReceiptConfirmed;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ConfirmReceiptController extends Controller
{
    public function index()
{
    // Get ALL goods receipts with relations, ordered by latest
    $receipts = GoodsReceipt::with(['purchaseOrder.supplier', 'receiver'])
        ->orderBy('created_at', 'desc')
        ->get();
    return Inertia::render('Manager/Procurement/ConfirmReceipts', ['receipts' => $receipts]);
}

    public function show(GoodsReceipt $goodsReceipt)
    {
        $goodsReceipt->load(['items.purchaseOrderItem.material', 'purchaseOrder', 'receiver']);
        return Inertia::render('Manager/Procurement/ConfirmReceipt', ['receipt' => $goodsReceipt]);
    }
public function confirm(GoodsReceipt $goodsReceipt)
{
    if ($goodsReceipt->status !== 'pending_confirmation') {
        return back()->with('error', 'This receipt is already confirmed.');
    }

    $goodsReceipt->status = 'confirmed';
    $goodsReceipt->confirmed_by = Auth::id();
    $goodsReceipt->confirmed_at = now();
    $goodsReceipt->save();

    // Update PO status
    $goodsReceipt->purchaseOrder->updateStatus();

    // ✅ Dispatch event
    event(new GoodsReceiptConfirmed($goodsReceipt));

    return redirect()->route('manager.procurement.confirm.index')
        ->with('success', "Goods Receipt #{$goodsReceipt->gr_number} confirmed.");
}


}
