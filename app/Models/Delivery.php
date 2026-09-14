<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    protected $fillable = [
        'order_id', 'driver_id', 'delivery_zone_id', 'tracking_number',
        'status', 'proof_image', 'notes', 'assigned_at', 'picked_up_at', 'delivered_at'
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'picked_up_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function zone()
    {
        return $this->belongsTo(DeliveryZone::class, 'delivery_zone_id');
    }

    // Generate tracking number: e.g., FMS-DEL-2026-0001
    public static function generateTrackingNumber()
    {
        $year = date('Y');
        $last = static::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $number = $last ? intval(substr($last->tracking_number, -4)) + 1 : 1;
        return 'FMS-DEL-' . $year . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }
}
