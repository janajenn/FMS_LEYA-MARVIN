<?php

namespace App\Http\Controllers\Admin;

use App\Models\Delivery;
use App\Models\Order;
use App\Models\User;
use App\Models\DeliveryZone;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

class DeliveryController extends Controller
{
    public function index()
    {
        $deliveries = Delivery::with(['order.user', 'driver', 'zone'])
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('Admin/Deliveries/Index', ['deliveries' => $deliveries]);
    }

    public function create()
    {
        $orders = Order::whereDoesntHave('delivery')
            ->where('status', '!=', 'cancelled')
            ->with('user')
            ->get();
        $drivers = User::whereHas('role', function ($q) {
            $q->where('slug', 'driver');
        })->get();
        $zones = DeliveryZone::where('is_active', true)->get();

        return Inertia::render('Admin/Deliveries/Create', [
            'orders' => $orders,
            'drivers' => $drivers,
            'zones' => $zones,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id|unique:deliveries,order_id',
            'driver_id' => 'nullable|exists:users,id',
            'delivery_zone_id' => 'required|exists:delivery_zones,id',
            'notes' => 'nullable|string',
        ]);

        $delivery = Delivery::create([
            'order_id' => $validated['order_id'],
            'driver_id' => $validated['driver_id'] ?? null,
            'delivery_zone_id' => $validated['delivery_zone_id'],
            'tracking_number' => Delivery::generateTrackingNumber(),
            'status' => $validated['driver_id'] ? 'assigned' : 'pending',
            'notes' => $validated['notes'] ?? null,
            'assigned_at' => $validated['driver_id'] ? now() : null,
        ]);

        return redirect()->route('admin.deliveries.index')->with('success', 'Delivery created.');
    }

    public function edit(Delivery $delivery)
    {
        $delivery->load(['order.user', 'driver', 'zone']);
        $drivers = User::whereHas('role', function ($q) {
            $q->where('slug', 'driver');
        })->get();
        $zones = DeliveryZone::where('is_active', true)->get();

        return Inertia::render('Admin/Deliveries/Edit', [
            'delivery' => $delivery,
            'drivers' => $drivers,
            'zones' => $zones,
        ]);
    }

    public function update(Request $request, Delivery $delivery)
    {
        $validated = $request->validate([
            'driver_id' => 'nullable|exists:users,id',
            'delivery_zone_id' => 'required|exists:delivery_zones,id',
            'status' => 'required|in:pending,assigned,picked_up,in_transit,delivered,failed',
            'notes' => 'nullable|string',
        ]);

        $delivery->update($validated);
        return redirect()->route('admin.deliveries.index')->with('success', 'Delivery updated.');
    }

    public function destroy(Delivery $delivery)
    {
        $delivery->delete();
        return redirect()->route('admin.deliveries.index')->with('success', 'Delivery deleted.');
    }
}
