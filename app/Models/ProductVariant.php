<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'material_id',
        'name',
        'slug',
        'price',
        'description',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price'     => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class, 'variant_id')
            ->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class, 'variant_id')
            ->where('is_primary', true);
    }

    public function getPrimaryImageUrlAttribute(): ?string
    {
        $img = $this->primaryImage ?? $this->images->first();
        return $img ? Storage::disk('public')->url($img->path) : null;
    }
}
