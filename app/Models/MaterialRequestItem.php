<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialRequestItem extends Model
{
    protected $fillable = [
        'material_request_id', 'material_id', 'quantity',
        'thickness', 'width', 'length', 'notes'
    ];

    public function materialRequest()
    {
        return $this->belongsTo(MaterialRequest::class);    
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function purchaseOrderItem()
    {
        return $this->hasOne(PurchaseOrderItem::class, 'material_request_item_id');
    }
}
