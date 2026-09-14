<?php

namespace App\Http\Controllers\DeliveryDriver;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DeliveryController extends Controller
{
    public function index()
    {
        $deliveries = Delivery::with(['order.user', 'zone'])
            ->where('driver_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('DeliveryDriver/Deliveries/Index', ['deliveries' => $deliveries]);
    }

    public function show(Delivery $delivery)
    {
        // Ensure the delivery belongs to this driver
        if ($delivery->driver_id !== Auth::id()) {
            abort(403);
        }
        $delivery->load(['order.user', 'zone']);
        return Inertia::render('DeliveryDriver/Deliveries/Show', ['delivery' => $delivery]);
    }

    public function updateStatus(Request $request, Delivery $delivery)
    {
        if ($delivery->driver_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:picked_up,in_transit,delivered,failed',
            'proof_image' => 'nullable|image|max:2048',
        ]);

        if ($validated['status'] === 'picked_up') {
            $delivery->picked_up_at = now();
        } elseif ($validated['status'] === 'delivered') {
            $delivery->delivered_at = now();
            // Also update order status?
            $delivery->order->update(['status' => 'delivered']);
        }

        $delivery->status = $validated['status'];

        if ($request->hasFile('proof_image')) {
            $path = $request->file('proof_image')->store('delivery_proofs', 'public');
            $delivery->proof_image = $path;
        }

        $delivery->save();

        return redirect()->route('driver.deliveries.index')->with('success', 'Delivery status updated.');
    }
}
