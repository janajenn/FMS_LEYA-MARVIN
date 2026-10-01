<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductSizeTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id', 'label',
        'length', 'width', 'height', 'thickness', 'diameter', 'depth',
        'sort_order', 'is_active',
    ];

    protected $casts = [
        'length'    => 'decimal:2',
        'width'     => 'decimal:2',
        'height'    => 'decimal:2',
        'thickness' => 'decimal:2',
        'diameter'  => 'decimal:2',
        'depth'     => 'decimal:2',
        'is_active' => 'boolean',
    ];


    protected $appends = ['dimensions_summary'];

    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    /**
     * Human-readable dimension summary, e.g. `48" × 75" × 18"`.
     */
    public function getDimensionsSummaryAttribute(): string
    {
        $parts = [];
        if ($this->length)    $parts[] = $this->length . '"';
        if ($this->width)     $parts[] = $this->width . '"';
        if ($this->height)    $parts[] = $this->height . '"';
        if ($this->thickness) $parts[] = 'T ' . $this->thickness . '"';
        if ($this->diameter)  $parts[] = 'Ø ' . $this->diameter . '"';
        if ($this->depth)     $parts[] = 'D ' . $this->depth . '"';
        return implode(' × ', $parts) ?: '—';
    }

    /**
     * Map to the six `standard_*` product fields.
     */
    public function toStandardDimensions(): array
    {
        return [
            'standard_length'    => $this->length,
            'standard_width'     => $this->width,
            'standard_height'    => $this->height,
            'standard_thickness' => $this->thickness,
            'standard_diameter'  => $this->diameter,
            'standard_depth'     => $this->depth,
        ];
    }

    /**
     * Does a given set of dimensions match this template?
     * Used to auto-detect the currently selected template on Edit.
     */
    public function matchesDimensions(array $dims): bool
    {
        $normalize = fn ($v) => $v === null || $v === '' ? null : (float) $v;
        $current = $this->toStandardDimensions();

        foreach (['standard_length', 'standard_width', 'standard_height',
                  'standard_thickness', 'standard_diameter', 'standard_depth'] as $key) {
            if ($normalize($current[$key] ?? null) !== $normalize($dims[$key] ?? null)) {
                return false;
            }
        }
        return true;
    }
}
