<?php

namespace App\Http\Controllers\Admin;

use App\Models\DeliveryZone;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

class DeliveryZoneController extends Controller
{
    public function index()
    {
        $zones = DeliveryZone::all();
        return Inertia::render('Admin/DeliveryZones/Index', ['zones' => $zones]);
    }

    public function create()
    {
        return Inertia::render('Admin/DeliveryZones/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'fee_type' => 'required|in:free,fixed',
            'fee' => 'required_if:fee_type,fixed|nullable|numeric|min:0',
            'estimated_days' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'radius' => 'nullable|numeric|min:0',
        ]);

        // If fee_type is free, set fee to 0
        if ($validated['fee_type'] === 'free') {
            $validated['fee'] = 0;
        }

        DeliveryZone::create($validated);
        return redirect()->route('admin.delivery-zones.index')->with('success', 'Zone created.');
    }

    public function edit(DeliveryZone $deliveryZone)
    {
        return Inertia::render('Admin/DeliveryZones/Edit', ['zone' => $deliveryZone]);
    }

    public function update(Request $request, DeliveryZone $deliveryZone)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'fee_type' => 'required|in:free,fixed',
            'fee' => 'required_if:fee_type,fixed|nullable|numeric|min:0',
            'estimated_days' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'radius' => 'nullable|numeric|min:0',
        ]);

        if ($validated['fee_type'] === 'free') {
            $validated['fee'] = 0;
        }

        $deliveryZone->update($validated);
        return redirect()->route('admin.delivery-zones.index')->with('success', 'Zone updated.');
    }

    public function destroy(DeliveryZone $deliveryZone)
    {
        $deliveryZone->delete();
        return redirect()->route('admin.delivery-zones.index')->with('success', 'Zone deleted.');
    }
}
