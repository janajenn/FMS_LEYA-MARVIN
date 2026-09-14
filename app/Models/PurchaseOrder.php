<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $fillable = [
        'po_number', 'material_request_id', 'supplier_id',
        'approved_by', 'approved_at', 'status', 'expected_delivery'
    ];

    protected $casts = [
        'approved_at' => 'datetime',
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

    public function getDamagedQuantityAttribute()
{
    return $this->goodsReceiptItems->sum('damaged_quantity');
}

    public static function generatePONumber()
    {
        $year = date('Y');
        $last = static::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $number = $last ? intval(substr($last->po_number, -4)) + 1 : 1;
        return 'PO-' . $year . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }

    public function getHasDamagedAttribute()
{
    return $this->goodsReceipts()->where('status', 'confirmed')->with('items')->get()
        ->flatMap(function ($gr) { return $gr->items; })
        ->sum('damaged_quantity') > 0;
}


/**
 * Recalculate and update the purchase order status based on current receipts.
 */
public function updateStatus()
{
    $totalOrdered = $this->items->sum('ordered_quantity');
    $totalAccepted = $this->items->sum(function ($item) {
        return $item->goodsReceiptItems->sum('accepted_quantity');
    });
    $totalReplacementPending = $this->items->sum('replacement_quantity');

    // All ordered quantity accepted and no pending replacements
    if ($totalAccepted >= $totalOrdered && $totalReplacementPending == 0) {
        $this->status = 'completed';
    }
    // All ordered accepted but replacements pending
    elseif ($totalAccepted >= $totalOrdered && $totalReplacementPending > 0) {
        $this->status = 'partially_delivered';
    }
    // Not all ordered accepted
    else {
        $this->status = 'partially_delivered';
    }

    $this->save();
}

}
