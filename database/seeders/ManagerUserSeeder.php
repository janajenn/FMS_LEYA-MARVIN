<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class ManagerUserSeeder extends Seeder
{
    public function run()
    {
        $managerRole = Role::where('slug', 'manager')->first();

        if (!$managerRole) {
            $this->command->error('Manager role not found. Please run RoleSeeder first.');
            return;
        }

        User::updateOrCreate(
            ['email' => 'manager@fms.com'],
            [
                'name' => 'Manager User',
                'password' => Hash::make('password'),
                'role_id' => $managerRole->id,
            ]
        );

        $this->command->info('Manager user created: manager@fms.com / password');
    }
}
