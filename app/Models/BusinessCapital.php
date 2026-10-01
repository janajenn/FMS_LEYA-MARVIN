<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessCapital extends Model
{
    protected $fillable = [
        'amount',
        'description',
        'recorded_by',
        'recorded_at',
    ];

    protected $casts = [
        'amount'      => 'decimal:2',
        'recorded_at' => 'datetime',
    ];

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * Total capital injected into the business (all time).
     */
    public static function total(): float
    {
        return (float) self::sum('amount');
    }
}
