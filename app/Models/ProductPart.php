<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductPart extends Model
{
    protected $fillable = [
        'product_id', 'name', 'reference_image', 'dimension_fields', 'sort_order'
    ];

    protected $casts = [
        'dimension_fields' => 'array',
    ];

    protected $appends = ['reference_image_url'];

public function getReferenceImageUrlAttribute()
{
    return $this->reference_image;
}

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
