<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            ['name' => 'Admin', 'slug' => 'admin', 'description' => 'System administrator'],
            ['name' => 'Manager', 'slug' => 'manager', 'description' => 'Store manager'],
            ['name' => 'Delivery Driver', 'slug' => 'driver', 'description' => 'Delivery personnel'],
            ['name' => 'Customer', 'slug' => 'customer', 'description' => 'Registered customer'],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }
}
