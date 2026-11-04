<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryFeeTier extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
        'min_distance_km',
        'max_distance_km',
        'fee',
        'estimated_days',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'min_distance_km' => 'float',
        'max_distance_km' => 'float',
        'fee'             => 'float',
        'estimated_days'  => 'integer',
        'is_active'       => 'boolean',
        'sort_order'      => 'integer',
    ];

    public function deliveries()
    {
        return $this->hasMany(Delivery::class);
    }
}
