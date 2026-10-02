<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Material extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id', 'name', 'unit', 'cost', 'supplier_id',
        'procurement_type', 'reorder_level', 'status',
        'stock_quantity', 'is_finish', 'attributes',
    ];

    protected $casts = [
        'attributes'   => 'array',
        'is_finish'    => 'boolean',
        'stock_quantity' => 'float',
        'cost'         => 'float',
        'reorder_level' => 'float',
    ];

    public function category()
    {
        return $this->belongsTo(MaterialCategory::class, 'category_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockHistory()
    {
        return $this->hasMany(StockHistory::class);
    }

    /**
     * Inverse of Product::materials() — every product whose BOM
     * includes this material.
     *
     * IMPORTANT: the pivot table name and column list MUST match
     * Product::materials(). If you ever rename the pivot table, update
     * both methods.
     */
 /**
 * Inverse of Product::materials().
 * Table name and pivot columns MUST match Product::materials() exactly.
 */
public function products()
{
    return $this->belongsToMany(
        \App\Models\Product::class,
        'product_material'
    )
        ->withPivot(
            'quantity',
            'unit',
            'calculation_type',
            'calculation_rule',
            'formula',
            'coverage_rate',
            'is_finish',
            'sort_order'
        )
        ->withTimestamps();
}
}
