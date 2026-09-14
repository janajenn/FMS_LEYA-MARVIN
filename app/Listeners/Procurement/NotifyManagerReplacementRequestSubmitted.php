<?php

namespace App\Listeners\Procurement;

use App\Events\Procurement\ReplacementRequestSubmitted;
use App\Models\Notification;
use App\Models\User;

class NotifyManagerReplacementRequestSubmitted
{
    public function handle(ReplacementRequestSubmitted $event)
    {
        $request = $event->materialRequest;

        $managers = User::whereHas('role', function ($q) {
            $q->where('slug', 'manager');
        })->get();

        foreach ($managers as $manager) {
            Notification::create([
                'user_id' => $manager->id,
                'type' => 'replacement_request',
                'title' => 'New Replacement Request',
                'message' => "Replacement Request #{$request->request_no} for PO #{$request->purchaseOrder->po_number} is pending review.",
                'reference_type' => MaterialRequest::class,
                'reference_id' => $request->id,
                'data' => [
                    'route' => route('manager.procurement.review.show', $request->id),
                    'reference_number' => $request->request_no,
                    'status' => $request->status,
                ],
            ]);
        }
    }
}
