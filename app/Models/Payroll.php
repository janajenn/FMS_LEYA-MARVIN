<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    protected $fillable = [
        'user_id', 'period_start', 'period_end', 'total_days_worked',
        'total_hours_worked', 'daily_rate', 'basic_salary', 'overtime_pay',
        'deductions', 'gross_salary', 'net_salary', 'status', 'paid_at', 'notes'
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'paid_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
