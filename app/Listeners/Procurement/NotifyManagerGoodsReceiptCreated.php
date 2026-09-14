<?php

namespace App\Listeners\Procurement;

use App\Events\Procurement\GoodsReceiptCreated;
use App\Models\Notification;
use App\Models\User;

class NotifyManagerGoodsReceiptCreated
{
    public function handle(GoodsReceiptCreated $event)
    {
        $gr = $event->goodsReceipt;

        $managers = User::whereHas('role', function ($q) {
            $q->where('slug', 'manager');
        })->get();

        foreach ($managers as $manager) {
            Notification::create([
                'user_id' => $manager->id,
                'type' => 'goods_receipt',
                'title' => 'Goods Receipt Pending Confirmation',
                'message' => "Goods Receipt #{$gr->gr_number} for PO #{$gr->purchaseOrder->po_number} is awaiting your confirmation.",
                'reference_type' => GoodsReceipt::class,
                'reference_id' => $gr->id,
                'data' => [
                    'route' => route('manager.procurement.confirm.show', $gr->id),
                    'reference_number' => $gr->gr_number,
                    'status' => $gr->status,
                ],
            ]);
        }
    }
}
