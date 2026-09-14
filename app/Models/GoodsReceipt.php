<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoodsReceipt extends Model
{
    protected $fillable = [
        'gr_number', 'purchase_order_id', 'received_by',
        'received_date', 'status', 'confirmed_by', 'confirmed_at'
    ];

    protected $casts = [
        'received_date' => 'date',
        'confirmed_at' => 'datetime',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function confirmer()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function items()
    {
        return $this->hasMany(GoodsReceiptItem::class);
    }

    public static function generateGRNumber()
    {
        $year = date('Y');
        $last = static::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $number = $last ? intval(substr($last->gr_number, -4)) + 1 : 1;
        return 'GR-' . $year . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }
}
