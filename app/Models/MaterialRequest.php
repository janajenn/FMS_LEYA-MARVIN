<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialRequest extends Model
{
    protected $fillable = [
        'request_no', 'requested_by', 'procurement_type', 'supplier_id',
        'reason', 'status', 'reviewed_by', 'reviewed_at', 'remarks',
    'type', 'purchase_order_id' // ✅ new
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];


    public function purchaseOrder()
{
    return $this->belongsTo(PurchaseOrder::class);
}

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(MaterialRequestItem::class);
    }



    public static function generateRequestNumber()
    {
        $year = date('Y');
        $last = static::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $number = $last ? intval(substr($last->request_no, -4)) + 1 : 1;
        return 'MR-' . $year . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }
}
