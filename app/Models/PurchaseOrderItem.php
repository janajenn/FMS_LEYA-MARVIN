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

    /* ═══════════════════════════════════════════════════════════════
     *  Relationships
     * ═══════════════════════════════════════════════════════════════ */

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

    /* ═══════════════════════════════════════════════════════════════
     *  Accessors — computed quantities across all receipts
     *
     *  These are what the Admin PO page and the receive-button flags
     *  depend on. Without them, `$item->remaining_quantity` returns
     *  null, and the "Receive Materials" button never appears.
     * ═══════════════════════════════════════════════════════════════ */

    /**
     * Sum of `accepted_quantity` across every confirmed receipt line.
     * Only confirmed receipts count toward "received".
     */
    public function getReceivedQuantityAttribute(): float
    {
        $this->loadMissing('goodsReceiptItems.goodsReceipt');

        return (float) $this->goodsReceiptItems
            ->filter(fn ($gri) => optional($gri->goodsReceipt)->status === 'confirmed')
            ->sum('accepted_quantity');
    }

    /**
     * Sum of `damaged_quantity` across every receipt line (confirmed
     * or pending — damaged items should always be visible).
     */
    public function getDamagedQuantityAttribute(): float
    {
        $this->loadMissing('goodsReceiptItems');

        return (float) $this->goodsReceiptItems->sum('damaged_quantity');
    }

    /**
     * How much of the ordered quantity has NOT yet been received.
     * Never goes below 0. Drives the "Receive Materials" button.
     */
    public function getRemainingQuantityAttribute(): float
    {
        $remaining = (float) $this->ordered_quantity
            - $this->getReceivedQuantityAttribute()
            - (float) $this->replacement_quantity;

        return max(0, $remaining);
    }
}
