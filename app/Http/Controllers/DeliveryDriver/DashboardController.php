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
        $inProgressCount = Delivery::where('driver_id', $driverId)
            ->whereIn('status', ['pending', 'picked_up', 'in_transit'])
            ->count();
        $completedCount = Delivery::where('driver_id', $driverId)
            ->where('status', 'delivered')
            ->count();

        $recentDeliveries = Delivery::with(['order.user', 'zone'])
            ->where('driver_id', $driverId)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('DeliveryDriver/Dashboard', [
            'stats' => [
                'assigned' => $assignedCount,
                'in_progress' => $inProgressCount,
                'completed' => $completedCount,
            ],
            'recentDeliveries' => $recentDeliveries,
        ]);
    }
}
