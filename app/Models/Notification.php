<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Notification extends Model
{
    protected $fillable = [
        'user_id', 'type', 'title', 'message',
        'reference_type', 'reference_id', 'data',
        'is_read', 'read_at'
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead()
    {
        $this->is_read = true;
        $this->read_at = now();
        $this->save();
    }

    public function getRouteAttribute()
    {
        return $this->data['route'] ?? null;
    }

    public function getReferenceNumberAttribute()
    {
        return $this->data['reference_number'] ?? null;
    }
}
