<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
         'purchase_order_id',   // ✅ new
        'category', 'description', 'amount',
        'expense_date', 'recorded_by', 'reference_number',
    ];

    protected $casts = [
        'amount' => 'float',
        'expense_date' => 'date',
    ];

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

      public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
