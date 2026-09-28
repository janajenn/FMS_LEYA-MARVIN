<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_number',
        'name',
        'contact_number',
        'position',
        'daily_rate',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'daily_rate' => 'float',
        'is_active'  => 'boolean',
    ];

    /**
     * Generate the next sequential employee number, e.g. EMP-001.
     */
    public static function generateEmployeeNumber(): string
    {
        $last = self::orderByDesc('id')->value('employee_number');

        $next = 1;
        if ($last && preg_match('/EMP-(\d+)/', $last, $m)) {
            $next = ((int) $m[1]) + 1;
        }

        return 'EMP-' . str_pad((string) $next, 3, '0', STR_PAD_LEFT);
    }


    public function assignedOrderItems()
{
    return $this->hasMany(OrderItem::class, 'assigned_employee_id');
}
}
