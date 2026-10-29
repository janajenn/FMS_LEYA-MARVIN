<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ProductPartDesign extends Model
{
    protected $fillable = [
        'product_part_id',
        'name',
        'image_path',
          'additional_cost', // <-- Added
        'is_default',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
         'additional_cost' => 'decimal:2', // <-- Added
        'is_default' => 'boolean',
        'is_active'  => 'boolean',
    ];

    protected $appends = ['image_url'];

    public function part()
    {
        return $this->belongsTo(ProductPart::class, 'product_part_id');
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path
            ? Storage::disk('public')->url($this->image_path)
            : null;
    }
}
