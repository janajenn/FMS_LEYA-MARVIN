<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryZone extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'fee',
        'fee_type',
        'estimated_days',
        'description',
        'is_active',
        'latitude',
        'longitude',
        'radius',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'fee' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'radius' => 'decimal:2',
    ];

    // Optional: helper to get fee display
    public function getFeeDisplayAttribute()
    {
        return $this->fee_type === 'free' ? 'Free' : '₱' . number_format($this->fee, 2);
    }


    public function deliveries()
    {
        return $this->hasMany(Delivery::class);
    }
}
