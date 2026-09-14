<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceLog extends Model
{
    protected $fillable = [
        'user_id', 'time_in', 'time_out', 'late_minutes', 'overtime_minutes', 'notes'
    ];

    protected $casts = [
        'time_in' => 'datetime',
        'time_out' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Calculate work duration in minutes
    public function getWorkDurationAttribute()
    {
        if ($this->time_in && $this->time_out) {
            return $this->time_in->diffInMinutes($this->time_out);
        }
        return null;
    }
}
