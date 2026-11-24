<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionRun extends Model
{
    protected $fillable = [
        'product_id',
        'variant_id',
        'quantity',
        'notes',
        'confirmed_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function confirmer()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    /**
     * Material consumption rows written by ProductionService.
     * Always filtered by reference_type = 'production' so we
     * never confuse them with goods receipts.
     */
    public function stockMovements()
    {
        return $this->hasMany(StockHistory::class, 'reference_id')
            ->where('reference_type', 'production');
    }
}
