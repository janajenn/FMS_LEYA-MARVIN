<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id', 'material_id', 'ordered_quantity',
        'thickness', 'width', 'length', 'replacement_quantity'
    ];

    // ✅ Add these to be included in JSON responses
    protected $appends = [
        'received_quantity',
        'damaged_quantity',
        'remaining_quantity',
        'replacement_remaining'
    ];

    // Relationships
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

    // Accessors
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
