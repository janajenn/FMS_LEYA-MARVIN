<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
   protected $fillable = [
    'user_id',
    'session_id',
    'product_id',
      'variant_id',           // ← NEW
    'quantity',
    'customization_data',
    'customization_surcharge',
    'customization_breakdown',   // ✅ add this
];



  protected $casts = [
    'customization_data'      => 'array',
    'customization_breakdown' => 'array',   // ← must be present
    'customization_surcharge' => 'decimal:2',
    'quantity'                => 'integer',
];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }


    public function variant()
{
    return $this->belongsTo(ProductVariant::class, 'variant_id');
}

/**
 * Resolved base price: variant price if a variant is chosen, else product price.
 */
public function getBasePriceAttribute(): float
{
    return (float) ($this->variant?->price ?? $this->product?->price ?? 0);
}
}
