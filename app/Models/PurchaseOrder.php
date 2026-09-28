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
        'actual_total_cost'    => 'decimal:2', // ✅ was 'float'
    ];

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

    public function getDamagedQuantityAttribute()
    {
        return $this->goodsReceiptItems->sum('damaged_quantity');
    }

    public function getHasDamagedAttribute()
    {
        return $this->goodsReceipts()
            ->where('status', 'confirmed')
            ->with('items')
            ->get()
            ->flatMap(fn ($gr) => $gr->items)
            ->sum('damaged_quantity') > 0;
    }

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

    // app/Models/PurchaseOrder.php
public function expense()
{
    return $this->hasOne(Expense::class);
}
}
