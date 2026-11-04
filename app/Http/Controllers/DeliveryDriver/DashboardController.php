<?php

namespace App\Http\Controllers\DeliveryDriver;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $driverId = Auth::id();

        $assignedCount = Delivery::where('driver_id', $driverId)->count();

        // Include 'assigned' — the new status set by DeliveryAssignmentService
        $inProgressCount = Delivery::where('driver_id', $driverId)
            ->whereIn('status', ['pending', 'assigned', 'picked_up', 'in_transit'])
            ->count();

        // Include 'completed' — set after balance collection; otherwise
        // the "Completed" stat drops to 0 the moment the driver finishes
        $completedCount = Delivery::where('driver_id', $driverId)
            ->whereIn('status', ['delivered', 'completed'])
            ->count();

        $recentDeliveries = Delivery::with(['order.user', 'tier'])   // ← was 'zone'
            ->where('driver_id', $driverId)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('DeliveryDriver/Dashboard', [
            'stats' => [
                'assigned'    => $assignedCount,
                'in_progress' => $inProgressCount,
                'completed'   => $completedCount,
            ],
            'recentDeliveries' => $recentDeliveries,
        ]);
    }
}