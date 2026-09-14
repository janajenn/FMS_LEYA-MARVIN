<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrackingController extends Controller
{
    public function show($trackingNumber)
    {
        $delivery = Delivery::with(['order.user', 'zone', 'driver'])
            ->where('tracking_number', $trackingNumber)
            ->firstOrFail();

        return Inertia::render('Customer/Tracking/Show', ['delivery' => $delivery]);
    }
}
