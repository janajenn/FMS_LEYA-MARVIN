<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;   // ← NEW

class Product extends Model
{
    use HasFactory, SoftDeletes;


  protected $fillable = [
    'category_id',
    'name',
    'slug',
    'description',
    'price',
    'stock_quantity',
    'is_customizable',
    'status',
    'standard_length',
    'standard_width',
    'standard_height',
    'standard_thickness',
    'standard_diameter',
    'standard_depth',
    'customization_markup_percent',
    'labor_cost',
'estimated_labor_hours',
];

protected $casts = [
    'price'                        => 'decimal:2',
    'standard_length'              => 'decimal:2',
    'standard_width'               => 'decimal:2',
    'standard_height'              => 'decimal:2',
    'standard_thickness'           => 'decimal:2',
    'standard_diameter'            => 'decimal:2',
    'standard_depth'               => 'decimal:2',
    'customization_markup_percent' => 'decimal:2',
    'is_customizable'              => 'boolean',
    'labor_cost'            => 'decimal:2',
'estimated_labor_hours' => 'decimal:2',
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
                ->withPivot(
                    'quantity',
                    'unit',
                    'calculation_type',
                    'calculation_rule',   // ✅ add this
                    'formula',
                    'coverage_rate',
                    'is_finish',
                    'sort_order'
                )
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



public function variants()
{
    return $this->hasMany(ProductVariant::class)->orderBy('sort_order');
}

public function activeVariants()
{
    return $this->hasMany(ProductVariant::class)
        ->where('is_active', true)
        ->orderBy('sort_order');
}

/**
 * Cheapest variant price (used on shop index as "from ₱X").
 */
public function getStartingPriceAttribute(): float
{
    $variantMin = $this->variants->min('price');
    return (float) ($variantMin ?? $this->price);
}



}
