<?php

namespace App\Http\Controllers\Admin;

use App\Models\Delivery;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeliveryController extends Controller
{
    public function index()
    {
        $deliveries = Delivery::with(['order.user', 'driver', 'tier'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Deliveries/Index', [
            'deliveries' => $deliveries,
        ]);
    }

    public function edit(Delivery $delivery)
    {
        $delivery->load(['order.user', 'driver', 'tier']);

        return Inertia::render('Admin/Deliveries/Edit', [
            'delivery' => $delivery,
        ]);
    }

    public function update(Request $request, Delivery $delivery)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,assigned,picked_up,in_transit,delivered,failed',
            'notes'  => 'nullable|string',
        ]);

        $delivery->update($validated);

        return redirect()->route('admin.deliveries.index')
            ->with('success', 'Delivery status updated.');
    }

    public function destroy(Delivery $delivery)
    {
        $delivery->delete();
        return redirect()->route('admin.deliveries.index')
            ->with('success', 'Delivery deleted.');
    }
}
