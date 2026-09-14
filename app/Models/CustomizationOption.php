<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomizationOption extends Model
{
    protected $fillable = ['product_id', 'name', 'type', 'sort_order'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function values()
    {
        return $this->hasMany(CustomizationOptionValue::class)->orderBy('sort_order');
    }
}
