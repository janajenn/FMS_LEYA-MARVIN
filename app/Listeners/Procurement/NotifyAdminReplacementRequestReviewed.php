<?php

namespace App\Listeners\Procurement;

use App\Events\Procurement\ReplacementRequestReviewed;
use App\Models\Notification;
use App\Models\User;

class NotifyAdminReplacementRequestReviewed
{
    public function handle(ReplacementRequestReviewed $event)
    {
        $request = $event->materialRequest;
        $action = $event->action; // 'approved', 'rejected'

        $admins = User::whereHas('role', function ($q) {
            $q->where('slug', 'admin');
        })->get();

        $title = $action === 'approved' ? 'Replacement Request Approved' : 'Replacement Request Rejected';
        $message = $action === 'approved'
            ? "Replacement Request #{$request->request_no} has been approved. You may now receive the replacement items."
            : "Replacement Request #{$request->request_no} has been rejected.";

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'replacement_request',
                'title' => $title,
                'message' => $message,
                'reference_type' => MaterialRequest::class,
                'reference_id' => $request->id,
                'data' => [
                    'route' => $action === 'approved'
                        ? route('admin.purchase-orders.show', $request->purchase_order_id)
                        : route('admin.material-requests.show', $request->id),
                    'reference_number' => $request->request_no,
                    'status' => $request->status,
                ],
            ]);
        }
    }
}
