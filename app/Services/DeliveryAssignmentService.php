<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\Order;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class DeliveryAssignmentService
{
    public function __construct(
        protected DeliveryFeeCalculator $calculator
    ) {}

    /**
     * Create a Delivery record for a shipped order.
     * Driver is picked automatically (least busy). Admin overrides later
     * via Admin > Orders > Show if needed (out of scope here).
     */
    public function assignForOrder(Order $order): ?Delivery
    {
        if ($existing = Delivery::where('order_id', $order->id)->first()) {
            Log::info('[DELIVERY ASSIGN] Already exists', [
                'order_id'    => $order->id,
                'delivery_id' => $existing->id,
            ]);
            return $existing;
        }

        // Compute tier + distance from the order's coordinates
        $tierId     = null;
        $distanceKm = null;

        if ($order->latitude !== null && $order->longitude !== null) {
            $result     = $this->calculator->resolve(
                (float) $order->latitude,
                (float) $order->longitude
            );
            $tierId     = $result['tier']['id'] ?? null;
            $distanceKm = $result['distance_km'] ?? null;
        } else {
            Log::warning('[DELIVERY ASSIGN] Missing coordinates — tier/distance null', [
                'order_id' => $order->id,
            ]);
        }

        $driver = $this->findLeastBusyDriver();

        if (! $driver) {
            Log::warning('[DELIVERY ASSIGN] No driver available', ['order_id' => $order->id]);
            return null;
        }

        $delivery = Delivery::create([
            'order_id'             => $order->id,
            'driver_id'            => $driver->id,
            'delivery_fee_tier_id' => $tierId,
            'distance_km'          => $distanceKm,
            'tracking_number'      => Delivery::generateTrackingNumber(),
            'status'               => 'assigned',
            'assigned_at'          => now(),
        ]);

        Log::info('[DELIVERY ASSIGN] Created', [
            'order_id'        => $order->id,
            'delivery_id'     => $delivery->id,
            'driver_id'       => $driver->id,
            'distance_km'     => $distanceKm,
            'tier_id'         => $tierId,
            'tracking_number' => $delivery->tracking_number,
        ]);

        return $delivery;
    }

    protected function findLeastBusyDriver(): ?User
    {
        $driverRole = Role::where('slug', 'driver')->first();
        if (! $driverRole) return null;

        return User::where('role_id', $driverRole->id)
            ->withCount(['deliveries as active_deliveries_count' => function ($q) {
                $q->whereIn('status', ['pending', 'assigned', 'picked_up', 'in_transit']);
            }])
            ->orderBy('active_deliveries_count', 'asc')
            ->orderBy('id', 'asc')
            ->first();
    }
}
