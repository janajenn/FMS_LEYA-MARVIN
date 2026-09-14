<?php

namespace App\Listeners\Procurement;

use App\Events\Procurement\MaterialRequestReviewed;
use App\Models\Notification;
use App\Models\User;

class NotifyAdminMaterialRequestReviewed
{
    public function handle(MaterialRequestReviewed $event)
    {
        $request = $event->materialRequest;
        $action = $event->action; // 'approved', 'rejected', 'returned'

        // Find admins
        $admins = User::whereHas('role', function ($q) {
            $q->where('slug', 'admin');
        })->get();

        $statusMap = [
            'approved' => 'approved',
            'rejected' => 'rejected',
            'returned' => 'returned for revision',
        ];

        $title = "Material Request {$statusMap[$action]}";
        $message = "Request #{$request->request_no} has been {$statusMap[$action]} by the manager.";

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'material_request',
                'title' => $title,
                'message' => $message,
                'reference_type' => MaterialRequest::class,
                'reference_id' => $request->id,
                'data' => [
                    'route' => route('admin.material-requests.show', $request->id),
                    'reference_number' => $request->request_no,
                    'status' => $request->status,
                ],
            ]);
        }
    }
}
