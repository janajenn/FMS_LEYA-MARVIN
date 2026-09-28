<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'material_id',
        'ordered_quantity',
        'thickness',
        'width',
        'length',
        'replacement_quantity',
        'actual_unit_cost',
        'actual_subtotal',
    ];

    // ✅ Only a plain list of appended attribute names
    protected $appends = [
        'received_quantity',
        'damaged_quantity',
        'remaining_quantity',
        'replacement_remaining',
    ];

    // ✅ Casts go here — decimal:2 is unambiguous and safe
    protected $casts = [
        'ordered_quantity'     => 'decimal:2',
        'thickness'            => 'decimal:2',
        'width'                => 'decimal:2',
        'length'               => 'decimal:2',
        'replacement_quantity' => 'decimal:2',
        'actual_unit_cost'     => 'decimal:2',
        'actual_subtotal'      => 'decimal:2',
    ];

    // ─── Relationships ───
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function goodsReceiptItems()
    {
        return $this->hasMany(GoodsReceiptItem::class, 'purchase_order_item_id');
    }

    // ─── Accessors ───
    public function getReceivedQuantityAttribute()
    {
        return $this->goodsReceiptItems->sum('accepted_quantity');
    }

    public function getDamagedQuantityAttribute()
    {
        return $this->goodsReceiptItems->sum('damaged_quantity');
    }

    public function getRemainingQuantityAttribute()
    {
        return max(0, $this->ordered_quantity - $this->received_quantity);
    }

    public function getReplacementRemainingAttribute()
    {
        return $this->replacement_quantity;
    }
}
