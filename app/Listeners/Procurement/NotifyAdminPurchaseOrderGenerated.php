<?php

namespace App\Listeners\Procurement;

use App\Events\Procurement\PurchaseOrderGenerated;
use App\Models\Notification;
use App\Models\User;

class NotifyAdminPurchaseOrderGenerated
{
    public function handle(PurchaseOrderGenerated $event)
    {
        $po = $event->purchaseOrder;

        $admins = User::whereHas('role', function ($q) {
            $q->where('slug', 'admin');
        })->get();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'purchase_order',
                'title' => 'Purchase Order Generated',
                'message' => "Purchase Order #{$po->po_number} has been generated and is ready for procurement.",
                'reference_type' => PurchaseOrder::class,
                'reference_id' => $po->id,
                'data' => [
                    'route' => route('admin.purchase-orders.show', $po->id),
                    'reference_number' => $po->po_number,
                    'status' => $po->status,
                ],
            ]);
        }
    }
}
