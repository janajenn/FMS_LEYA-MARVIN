<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\DeliveryZone;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class DeliveryAssignmentService
{
    /**
     * Create a Delivery record for a shipped order and assign a driver.
     */
    public function assignForOrder(Order $order): ?Delivery
    {
        // Avoid duplicates
        if (Delivery::where('order_id', $order->id)->exists()) {
            Log::info('[DELIVERY ASSIGN] Delivery already exists for order', ['order_id' => $order->id]);
            return Delivery::where('order_id', $order->id)->first();
        }

        // 1. Find the delivery zone by matching the order's zone name
        $zone = null;
        if ($order->delivery_zone) {
            $zone = DeliveryZone::where('name', $order->delivery_zone)->first();
        }

        // 2. Find an appropriate driver
        $driver = $this->findDriverForZone($zone);

        if (!$driver) {
            Log::warning('[DELIVERY ASSIGN] No driver available for order', [
                'order_id' => $order->id,
                'zone' => $order->delivery_zone,
            ]);
            return null;
        }

        // 3. Create the delivery
        $delivery = Delivery::create([
            'order_id' => $order->id,
            'driver_id' => $driver->id,
            'delivery_zone_id' => $zone?->id, // ✅ matches your model
            'tracking_number' => Delivery::generateTrackingNumber(),
            'status' => 'pending',
            'assigned_at' => now(), // ✅ your model has this field
        ]);

        Log::info('[DELIVERY ASSIGN] Delivery created and assigned', [
            'order_id' => $order->id,
            'delivery_id' => $delivery->id,
            'driver_id' => $driver->id,
            'driver_name' => $driver->name,
            'tracking_number' => $delivery->tracking_number,
        ]);

        return $delivery;
    }

    /**
     * Pick a driver for the given zone.
     * Strategy: prefer a driver assigned to the zone, fallback to any driver with fewest active deliveries.
     */
    protected function findDriverForZone(?DeliveryZone $zone): ?User
    {
        $driverRole = \App\Models\Role::where('slug', 'driver')->first();
        if (!$driverRole) {
            return null;
        }

        $query = User::where('role_id', $driverRole->id);

        // If your users table has a delivery_zone_id, prefer matching driver
        if ($zone && Schema::hasColumn('users', 'delivery_zone_id')) {
            $matched = (clone $query)->where('delivery_zone_id', $zone->id)->first();
            if ($matched) {
                return $matched;
            }
        }

        // Fallback: driver with fewest active deliveries
        return $query->withCount(['deliveries as active_deliveries_count' => function ($q) {
                $q->whereIn('status', ['pending', 'picked_up', 'in_transit']);
            }])
            ->orderBy('active_deliveries_count', 'asc')
            ->first();
    }
}
