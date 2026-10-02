<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $fillable = [
        'po_number',
        'material_request_id',
        'supplier_id',
        'approved_by',
        'approved_at',
        'status',
        'expected_delivery',
        'actual_total_cost',
        'purchase_recorded_at',
        'purchase_recorded_by',
    ];

    protected $casts = [
        'approved_at'          => 'datetime',
        'purchase_recorded_at' => 'datetime',
        'actual_total_cost'    => 'decimal:2',
    ];

    /* ═══════════════════════════════════════════════════════════════
     *  Relationships
     * ═══════════════════════════════════════════════════════════════ */

    public function materialRequest()
    {
        return $this->belongsTo(MaterialRequest::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function goodsReceipts()
    {
        return $this->hasMany(GoodsReceipt::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'purchase_recorded_by');
    }

    public function expense()
    {
        return $this->hasOne(Expense::class);
    }

    /**
     * All receipt line items across every goods receipt for this PO.
     * Uses hasManyThrough so you can iterate line items directly.
     */
    public function goodsReceiptItems()
    {
        return $this->hasManyThrough(
            GoodsReceiptItem::class,        // final model
            GoodsReceipt::class,            // intermediate model
            'purchase_order_id',            // FK on goods_receipts
            'goods_receipt_id',             // FK on goods_receipt_items
            'id',                           // PK on purchase_orders
            'id'                            // PK on goods_receipts
        );
    }

    /* ═══════════════════════════════════════════════════════════════
     *  Accessors
     * ═══════════════════════════════════════════════════════════════ */

    /**
     * Total damaged quantity across all receipt lines.
     * Fixed: previously used `$this->goodsReceiptItems` (property form)
     * which threw because the relationship wasn't defined.
     */
    public function getDamagedQuantityAttribute(): float
    {
        return (float) $this->goodsReceiptItems()->sum('damaged_quantity');
    }

    public function getHasDamagedAttribute(): bool
    {
        return $this->goodsReceipts()
            ->where('status', 'confirmed')
            ->with('items')
            ->get()
            ->flatMap(fn ($gr) => $gr->items)
            ->sum('damaged_quantity') > 0;
    }

    /* ═══════════════════════════════════════════════════════════════
     *  Helpers
     * ═══════════════════════════════════════════════════════════════ */

    public static function generatePONumber()
    {
        $year = date('Y');
        $last = static::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $number = $last ? intval(substr($last->po_number, -4)) + 1 : 1;
        return 'PO-' . $year . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }

    public function updateStatus()
    {
        $totalOrdered = $this->items->sum('ordered_quantity');
        $totalAccepted = $this->items->sum(function ($item) {
            return $item->goodsReceiptItems->sum('accepted_quantity');
        });
        $totalReplacementPending = $this->items->sum('replacement_quantity');

        if ($totalAccepted >= $totalOrdered && $totalReplacementPending == 0) {
            $this->status = 'completed';
        } elseif ($totalAccepted >= $totalOrdered && $totalReplacementPending > 0) {
            $this->status = 'partially_delivered';
        } else {
            $this->status = 'partially_delivered';
        }

        $this->save();
    }
}
