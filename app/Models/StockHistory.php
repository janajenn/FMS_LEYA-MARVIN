<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockHistory extends Model
{
    protected $table = 'stock_history';

    protected $fillable = [
        'material_id', 'reference_type', 'reference_id',
        'quantity_change', 'previous_quantity', 'new_quantity',
        'note', 'created_by'
    ];

    protected $casts = [
        'quantity_change' => 'decimal:2',
        'previous_quantity' => 'decimal:2',
        'new_quantity' => 'decimal:2',
    ];

    protected $appends = [
    'gr_number',
    'po_number',
    'received_date',
    'goods_receipt_status'
];

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ✅ Remove the where clause – we filter in the controller
    public function goodsReceipt()
    {
        return $this->belongsTo(GoodsReceipt::class, 'reference_id');
    }

   public function getGoodsReceiptStatusAttribute()
{
    if ($this->reference_type !== 'goods_receipt') {
        return null;
    }
    return $this->goodsReceipt?->status ?? 'pending_confirmation';
}

public function getGrNumberAttribute()
{
    if ($this->reference_type !== 'goods_receipt') {
        return null;
    }
    return $this->goodsReceipt?->gr_number ?? 'N/A';
}

public function getPoNumberAttribute()
{
    if ($this->reference_type !== 'goods_receipt') {
        return null;
    }
    return $this->goodsReceipt?->purchaseOrder?->po_number ?? 'N/A';
}

public function getReceivedDateAttribute()
{
    if ($this->reference_type !== 'goods_receipt') {
        return null;
    }
    return $this->goodsReceipt?->received_date ?? null;
}



}
