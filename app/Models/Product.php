<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    protected $fillable = [
        'category_id', 'name', 'slug', 'description', 'price',
        'stock_quantity', 'is_customizable', 'status'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_customizable' => 'boolean',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(function ($product) {
            $product->slug = Str::slug($product->name);
        });
    }

    public function category()
    {
        return $this->belongsTo(ProductCategory::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }



public function materials()
{
    return $this->belongsToMany(Material::class, 'product_material')
                ->withPivot('quantity', 'unit', 'calculation_type', 'formula', 'coverage_rate', 'is_finish', 'sort_order')
                ->withTimestamps();
}



    // Get primary image
    public function getPrimaryImageAttribute()
    {
        return $this->images->where('is_primary', true)->first()?->path
               ?? $this->images->first()?->path
               ?? null;
    }

//

public function parts()
{
    return $this->hasMany(ProductPart::class)->orderBy('sort_order');
}


public function finishes()
{
    return $this->materials()->wherePivot('is_finish', true);
}

}
