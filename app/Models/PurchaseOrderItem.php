<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'material_id',
        'ordered_quantity',
        'replacement_quantity',
        'thickness',
        'width',
        'length',
        'actual_unit_cost',
        'actual_subtotal',
    ];

    protected $casts = [
        'ordered_quantity'     => 'float',
        'replacement_quantity' => 'float',
        'actual_unit_cost'     => 'decimal:2',
        'actual_subtotal'      => 'decimal:2',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    /**
     * Every receipt line item that references this PO item.
     * FK: goods_receipt_items.purchase_order_item_id
     */
    public function goodsReceiptItems()
    {
        return $this->hasMany(GoodsReceiptItem::class, 'purchase_order_item_id');
    }
}
