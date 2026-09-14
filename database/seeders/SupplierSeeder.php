<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class SupplierSeeder extends Seeder
{
    public function run()
    {
        Supplier::create([
            'name' => 'Woodland Supplies Inc.',
            'contact_person' => 'John Doe',
            'phone' => '123-456-7890',
            'email' => 'info@woodland.com',
            'address' => '123 Forest St, Timber City',
        ]);
        Supplier::create([
            'name' => 'MetalCraft Co.',
            'contact_person' => 'Jane Smith',
            'phone' => '098-765-4321',
            'email' => 'sales@metalcraft.com',
            'address' => '456 Industrial Ave, Steel Town',
        ]);
        // add more as needed
    }
}
