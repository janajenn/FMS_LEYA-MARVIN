<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductPart extends Model
{
   protected $fillable = [
    'product_id',
    'name',
    'reference_image',
    'dimension_fields',
    'standard_length',
    'standard_width',
    'standard_height',
    'standard_thickness',
    'standard_diameter',
    'standard_depth',
    'sort_order',
];

protected $casts = [
    'dimension_fields'   => 'array',
    'standard_length'    => 'decimal:2',
    'standard_width'     => 'decimal:2',
    'standard_height'    => 'decimal:2',
    'standard_thickness' => 'decimal:2',
    'standard_diameter'  => 'decimal:2',
    'standard_depth'     => 'decimal:2',
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



    /**
 * Return the standard value for a given dimension field name.
 * e.g. standardFor('Length') → 60.00 or null
 */
public function standardFor(string $field): ?float
{
    $key = 'standard_' . strtolower($field);
    $value = $this->{$key} ?? null;

    return $value === null || $value === '' ? null : (float) $value;
}

/**
 * Return an associative array of { field => standard } for every
 * dimension the customer is allowed to customize.
 */
public function standardsForCustomizableFields(): array
{
    $result = [];
    foreach (($this->dimension_fields ?? []) as $field) {
        $value = $this->standardFor($field);
        if ($value !== null) {
            $result[$field] = $value;
        }
    }
    return $result;
}



}
