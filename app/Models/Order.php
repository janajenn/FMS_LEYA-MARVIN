<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
    'user_id', 'order_number', 'total', 'status', 'payment_status',
    'shipping_address', 'delivery_zone', 'delivery_fee', 'notes',
    'latitude', 'longitude',
    'source', 'kiosk_id', 'customer_name', 'customer_phone',  // NEW
];

protected $casts = [
    'total'            => 'float',
    'delivery_fee'     => 'float',
    'production_stage' => 'string',
    'source'           => 'string',                            // NEW
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

        public static function generateOrderNumber()
    {
        $year = date('Y');
        $prefix = 'FMS-' . $year . '-';
        
        // Find the order with the highest numerical value for this year
        $lastOrder = static::where('order_number', 'LIKE', $prefix . '%')
            ->orderByRaw('CAST(SUBSTRING(order_number, -4) AS UNSIGNED) DESC')
            ->first();

        $number = 1;
        if ($lastOrder) {
            // Extract the last 4 digits and add 1
            $number = intval(substr($lastOrder->order_number, -4)) + 1;
        }
        
        // Loop just in case there is a gap or manual entry collision
        do {
            $orderNumber = $prefix . str_pad($number, 4, '0', STR_PAD_LEFT);
            $exists = static::where('order_number', $orderNumber)->exists();
            if ($exists) {
                $number++;
            }
        } while ($exists);

        return $orderNumber;
    }

    /* ═══════════════════════════════════════════════════════════════════
     *  PRODUCTION STAGES — SINGLE SOURCE OF TRUTH
     * ═══════════════════════════════════════════════════════════════════
     *
     *  This method defines the canonical order and labels. It is shared
     *  to the frontend via Inertia (see HandleInertiaRequests) so the
     *  Admin and Customer pages can never display a different order.
     *
     *  If you need to reorder or rename a stage, edit this array ONLY.
     *  Both pages will automatically follow.
     */
    public static function getProductionStagesMeta(): array
    {
        return [
            ['key' => 'carpentry',    'label' => 'Carpentry / Assembly'],
            ['key' => 'wood_filling', 'label' => 'Wood Filling / Prep'],
            ['key' => 'sanding',      'label' => 'Sanding'],
            ['key' => 'varnishing',   'label' => 'Varnishing / Finishing'],
        ];
    }

    /** Ordered array of stage keys, e.g. ['carpentry','wood_filling',...]. */
    public static function getProductionStages(): array
    {
        return array_column(self::getProductionStagesMeta(), 'key');
    }

    /** Friendly label for a stage key. Accepts 'completed' as a special case. */
    public static function getStageLabel($stage)
    {
        if ($stage === 'completed') {
            return 'Completed';
        }
        foreach (self::getProductionStagesMeta() as $s) {
            if ($s['key'] === $stage) {
                return $s['label'];
            }
        }
        return $stage;
    }

    public function isProductionComplete()
    {
        return $this->production_stage === 'completed';
    }

    public function getCurrentStageIndex()
    {
        $stages = self::getProductionStages();
        $index = array_search($this->production_stage, $stages);
        return $index !== false ? $index : -1;
    }

    public function getNextStage()
    {
        $stages = self::getProductionStages();
        $currentIndex = $this->getCurrentStageIndex();
        if ($currentIndex === -1 || $currentIndex >= count($stages) - 1) {
            return null;
        }
        return $stages[$currentIndex + 1];
    }

    public function isStageCompleted($stage)
    {
        $stages = self::getProductionStages();
        $stageIndex = array_search($stage, $stages);
        if ($stageIndex === false) return false;
        $currentIndex = $this->getCurrentStageIndex();
        if ($this->production_stage === 'completed') return true;
        return $stageIndex < $currentIndex;
    }

    public function isStageCurrent($stage)
    {
        return $this->production_stage === $stage;
    }
}
