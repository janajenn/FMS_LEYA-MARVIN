<?php

namespace App\Http\Controllers\Api\V1\Driver;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeDriver($request);

        $driverId = $request->user()->id;

        $assignedCount   = Delivery::where('driver_id', $driverId)->count();
        $inProgressCount = Delivery::where('driver_id', $driverId)
            ->whereIn('status', ['pending', 'assigned', 'picked_up', 'in_transit'])
            ->count();
        $completedCount  = Delivery::where('driver_id', $driverId)
            ->whereIn('status', ['delivered', 'completed'])
            ->count();

        $recent = Delivery::with(['order.user', 'zone'])
            ->where('driver_id', $driverId)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'assigned'    => $assignedCount,
                'in_progress' => $inProgressCount,
                'completed'   => $completedCount,
            ],
            'recent_deliveries' => $recent->map(fn ($d) => $this->summarize($d)),
        ]);
    }

    private function summarize(Delivery $d): array
    {
        return [
            'id'              => $d->id,
            'tracking_number' => $d->tracking_number,
            'status'          => $d->status,
            'order' => $d->order ? [
                'id'               => $d->order->id,
                'order_number'     => $d->order->order_number,
                'customer_name'    => $d->order->user?->name,
                'shipping_address' => $d->order->shipping_address,
            ] : null,
        ];
    }

    private function authorizeDriver(Request $request): void
    {
        if (optional($request->user()->role)->slug !== 'driver') {
            abort(403, 'This endpoint is for delivery drivers only.');
        }
    }
}
