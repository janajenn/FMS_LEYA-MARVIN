<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomizationOptionValue extends Model
{
    protected $fillable = ['customization_option_id', 'value', 'price_adjustment', 'sort_order'];

    protected $casts = [
        'price_adjustment' => 'decimal:2',
    ];

    public function option()
    {
        return $this->belongsTo(CustomizationOption::class);
    }
}
