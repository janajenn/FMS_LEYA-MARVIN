<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'order_number', 'total', 'status', 'payment_status',
        'shipping_address', 'delivery_zone', 'delivery_fee', 'notes',
    ];

   protected $casts = [
    'total' => 'float',
    'delivery_fee' => 'float',
     'production_stage' => 'string',
];


    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function delivery()
{
    return $this->hasOne(Delivery::class);
}

    // Generate order number (e.g., FMS-2026-0001)
    public static function generateOrderNumber()
    {
        $year = date('Y');
        $lastOrder = static::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $number = $lastOrder ? intval(substr($lastOrder->order_number, -4)) + 1 : 1;
        return 'FMS-' . $year . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }



    // Define the stages in order
public static function getProductionStages()
{
    return ['carpentry', 'sanding', 'wood_filling', 'varnishing'];
}

// Check if all production stages are completed
public function isProductionComplete()
{
    return $this->production_stage === 'completed';
}

// Get the display label for a stage
public static function getStageLabel($stage)
{
    $labels = [
        'carpentry'   => 'Carpentry / Furniture Assembly',
        'sanding'     => 'Sanding',
        'wood_filling'=> 'Wood Filling / Surface Preparation',
        'varnishing'  => 'Varnishing / Finishing',
        'completed'   => 'Completed',
    ];
    return $labels[$stage] ?? $stage;
}

// Get the current stage index (0-based)
public function getCurrentStageIndex()
{
    $stages = self::getProductionStages();
    $index = array_search($this->production_stage, $stages);
    return $index !== false ? $index : -1;
}

// Get the next stage (if any)
public function getNextStage()
{
    $stages = self::getProductionStages();
    $currentIndex = $this->getCurrentStageIndex();
    if ($currentIndex === -1 || $currentIndex >= count($stages) - 1) {
        return null;
    }
    return $stages[$currentIndex + 1];
}

// Check if a given stage is completed (i.e., before the current stage)
public function isStageCompleted($stage)
{
    $stages = self::getProductionStages();
    $stageIndex = array_search($stage, $stages);
    if ($stageIndex === false) return false;
    $currentIndex = $this->getCurrentStageIndex();
    // If current stage is completed, all are completed
    if ($this->production_stage === 'completed') return true;
    return $stageIndex < $currentIndex;
}

// Check if a given stage is the current stage
public function isStageCurrent($stage)
{
    return $this->production_stage === $stage;
}


}
