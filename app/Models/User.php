<?php

namespace App\Models;

use App\Models\Role;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected $fillable = [
    'name', 'email', 'password', 'role_id', 'qr_code', 'is_employee', 'employee_number'
];

    public function role()
{
    return $this->belongsTo(Role::class);
}

// Helper methods
public function hasRole($slug)
{
    return $this->role && $this->role->slug === $slug;
}

public function isAdmin()
{
    return $this->hasRole('admin');
}

public function isManager()
{
    return $this->hasRole('manager');
}

public function isDriver()
{
    return $this->hasRole('driver');
}

public function isCustomer()
{
    return $this->hasRole('customer');
}

public function deliveries()
{
    return $this->hasMany(Delivery::class, 'driver_id');
}

public function attendanceLogs()
{
    return $this->hasMany(AttendanceLog::class);
}
}
