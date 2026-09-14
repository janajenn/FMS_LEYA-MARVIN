<?php

namespace App\Listeners\Procurement;

use App\Events\Procurement\MaterialRequestSubmitted;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotifyManagerNewMaterialRequest
{
    public function handle(MaterialRequestSubmitted $event)
    {
        $request = $event->materialRequest;

        // Find all managers
        $managers = User::whereHas('role', function ($q) {
            $q->where('slug', 'manager');
        })->get();

        foreach ($managers as $manager) {
            Notification::create([
                'user_id' => $manager->id,
                'type' => 'material_request',
                'title' => 'New Material Request',
                'message' => "Request #{$request->request_no} has been submitted and is pending your review.",
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
