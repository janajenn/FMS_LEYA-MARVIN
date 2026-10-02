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
        'actual_total_cost',
        'purchase_recorded_at',
        'purchase_recorded_by',
    ];

    protected $casts = [
        'approved_at'          => 'datetime',
        'purchase_recorded_at' => 'datetime',
        'actual_total_cost'    => 'float',
    ];

    /**
     * Always expose a printable supplier name.
     * Falls back to "N/A" when the PO was created from a walk-in
     * purchase with no registered supplier.
     */
    protected $appends = ['supplier_name'];

    public function getSupplierNameAttribute(): string
    {
        return $this->supplier?->name ?? 'N/A';
    }

    public function materialRequest()
    {
        return $this->belongsTo(MaterialRequest::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'purchase_recorded_by');
    }

    public static function generatePONumber(): string
    {
        $year = date('Y');
        $last = static::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $number = $last ? intval(substr($last->po_number, -4)) + 1 : 1;
        return 'PO-' . $year . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }
}
