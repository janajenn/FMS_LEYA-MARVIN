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
     * Human-readable dimension summary.
     *
     * All stored values are in INCHES — see config/units.php.
     * The unit suffix is pulled from config so it stays in sync with
     * every other page that renders a dimension.
     *
     * Example: `48 × 24 × 30 in`
     *          `T 1 in × D 18 in`
     */
    public function getDimensionsSummaryAttribute(): string
    {
        $unit = config('units.dimension_short', 'in');

        $parts = [];
        if ($this->length)    $parts[] = $this->trim($this->length)    . " {$unit}";
        if ($this->width)     $parts[] = $this->trim($this->width)     . " {$unit}";
        if ($this->height)    $parts[] = $this->trim($this->height)    . " {$unit}";
        if ($this->thickness) $parts[] = 'T ' . $this->trim($this->thickness) . " {$unit}";
        if ($this->diameter)  $parts[] = 'Ø ' . $this->trim($this->diameter)  . " {$unit}";
        if ($this->depth)     $parts[] = 'D ' . $this->trim($this->depth)     . " {$unit}";

        return implode(' × ', $parts) ?: '—';
    }

    /**
     * Strip trailing zeros from a decimal-cast string ("48.00" → "48",
     * "1.50" → "1.5") so the summary stays compact.
     */
    private function trim($value): string
    {
        $n = (float) $value;
        return rtrim(rtrim(number_format($n, 2, '.', ''), '0'), '.') ?: '0';
    }

    /**
     * Map to the six `standard_*` product fields.
     * All values are in INCHES.
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
     * All values are compared in INCHES.
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
