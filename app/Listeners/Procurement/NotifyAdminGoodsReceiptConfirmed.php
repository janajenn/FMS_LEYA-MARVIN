<?php

namespace App\Listeners\Procurement;

use App\Events\Procurement\GoodsReceiptConfirmed;
use App\Models\Notification;
use App\Models\User;

class NotifyAdminGoodsReceiptConfirmed
{
    public function handle(GoodsReceiptConfirmed $event)
    {
        $gr = $event->goodsReceipt;

        $admins = User::whereHas('role', function ($q) {
            $q->where('slug', 'admin');
        })->get();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'goods_receipt',
                'title' => 'Goods Receipt Confirmed',
                'message' => "Goods Receipt #{$gr->gr_number} has been successfully confirmed.",
                'reference_type' => GoodsReceipt::class,
                'reference_id' => $gr->id,
                'data' => [
                    'route' => route('admin.purchase-orders.show', $gr->purchase_order_id),
                    'reference_number' => $gr->gr_number,
                    'status' => $gr->status,
                ],
            ]);
        }
    }
}
