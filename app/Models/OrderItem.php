<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
   protected $fillable = [
    'order_id',
    'product_id',
     'variant_id',           // ← NEW
    'quantity',
    'price',
    'customization_surcharge',
    'customization_breakdown',   // ✅ must be present
    'customization_data',
    'calculated_materials',
    'assigned_employee_id',
'labor_cost',
'labor_status',
'assigned_by',
'assigned_at',
'labor_completed_at',
];

protected $casts = [
    'customization_breakdown' => 'array',   // ✅ must be present
    'customization_data'      => 'array',
    'calculated_materials'    => 'array',
    'price'                   => 'decimal:2',
    'customization_surcharge' => 'decimal:2',
    'labor_cost'         => 'decimal:2',
'assigned_at'        => 'datetime',
'labor_completed_at' => 'datetime',
];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }


    public function variant()
{
    return $this->belongsTo(ProductVariant::class, 'variant_id');
}

/**
 * Snapshot of the variant name at order time (falls back to null).
 */
public function getVariantNameAttribute(): ?string
{
    return $this->variant?->name;
}


public function assignedEmployee()
{
    return $this->belongsTo(Employee::class, 'assigned_employee_id');
}

public function assigner()
{
    return $this->belongsTo(User::class, 'assigned_by');
}
}
