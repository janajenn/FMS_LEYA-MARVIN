<?php

namespace App\Listeners\Procurement;

use App\Events\Procurement\ReplacementRequestSubmitted;
use App\Models\MaterialRequest;   // <-- was missing
use App\Models\Notification;
use App\Models\User;

class NotifyManagerReplacementRequestSubmitted
{
    public function handle(ReplacementRequestSubmitted $event)
    {
        $request = $event->materialRequest;

        // Ensure the relation is present even if it wasn't eager-loaded
        $request->loadMissing('purchaseOrder');

        // PO may legitimately be null (e.g. non-PO replacement requests)
        $poNumber = $request->purchaseOrder?->po_number;
        $poLabel  = $poNumber ? "PO #{$poNumber}" : 'No PO';

        $managers = User::whereHas('role', function ($q) {
            $q->where('slug', 'manager');
        })->get();

        foreach ($managers as $manager) {
            Notification::create([
                'user_id'        => $manager->id,
                'type'           => 'replacement_request',
                'title'          => 'New Replacement Request',
                'message'        => "Replacement Request #{$request->request_no} for {$poLabel} is pending review.",
                'reference_type' => MaterialRequest::class,
                'reference_id'   => $request->id,
                'data' => [
                    'route'            => route('manager.procurement.review.show', $request->id),
                    'reference_number' => $request->request_no,
                    'status'           => $request->status,
                ],
            ]);
        }
    }
}
