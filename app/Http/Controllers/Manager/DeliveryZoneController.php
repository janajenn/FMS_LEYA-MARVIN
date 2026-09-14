<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\DeliveryZone;
use Inertia\Inertia;

class DeliveryZoneController extends Controller
{
    public function index()
    {
        $zones = DeliveryZone::all();
        return Inertia::render('Manager/DeliveryZones/Index', ['zones' => $zones]);
    }
}
