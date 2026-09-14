<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
   protected $fillable = [
    'category_id', 'name', 'unit', 'cost', 'stock_quantity',
    'attributes', 'supplier_id', 'procurement_type', 'reorder_level', 'status', 'is_finish'
];
    protected $casts = [
        'attributes' => 'array',
        'cost' => 'decimal:2',
        'stock_quantity' => 'decimal:2',
    ];



public function materialRequests()
{
    return $this->hasMany(MaterialRequestItem::class);
}



// Optional scope
public function scopeFinishes($query)
{
    return $query->where('is_finish', true);
}

    public function category()
    {
        return $this->belongsTo(MaterialCategory::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockIns()
    {
        return $this->hasMany(StockIn::class);
    }

    public function stockHistory()
    {
        return $this->hasMany(StockHistory::class);
    }
}
