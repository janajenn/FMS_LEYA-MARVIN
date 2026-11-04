<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
   protected $fillable = [
    'order_id', 'amount', 'method', 'status', 'type',
    'transaction_id', 'reference_number', 'paid_at',
    'proof_image',
    'received_by',                                             // NEW
];

protected $casts = [
    'amount'      => 'decimal:2',
    'paid_at'     => 'datetime',
    'received_by' => 'integer',                                // NEW
];


public function receiver()                                     // NEW
{
    return $this->belongsTo(User::class, 'received_by');
}




    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
