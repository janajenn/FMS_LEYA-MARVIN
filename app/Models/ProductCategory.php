<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ProductCategory extends Model
{
    protected $fillable = ['name', 'slug', 'description'];

    /**
     * Use `booted()` (Laravel 8+) instead of `boot()`.
     * This is the correct hook for adding model event listeners.
     */
    protected static function booted(): void
    {
        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });

        static::updating(function ($category) {
            if ($category->isDirty('name') && empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    public function products()
{
    return $this->hasMany(Product::class, 'category_id');
}

    public function sizeTemplates()
    {
        return $this->hasMany(ProductSizeTemplate::class, 'category_id')
            ->orderBy('sort_order');
    }
}
