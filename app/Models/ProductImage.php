<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
   protected $fillable = [
    'product_id',
    'variant_id',   // ← new
    'path',
    'is_primary',
    'sort_order',
];


    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }


    public function variant()
{
    return $this->belongsTo(ProductVariant::class, 'variant_id');
}
}
