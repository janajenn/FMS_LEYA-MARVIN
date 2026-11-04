<?php

namespace Database\Seeders;

use App\Models\DeliveryFeeTier;
use Illuminate\Database\Seeder;

class DeliveryFeeTierSeeder extends Seeder
{
    public function run(): void
    {
        if (DeliveryFeeTier::exists()) return;

        DeliveryFeeTier::insert([
            ['label' => 'Free (0–5 km)',      'min_distance_km' => 0,  'max_distance_km' => 5,    'fee' => 0,   'is_active' => true, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['label' => 'Near (5–10 km)',     'min_distance_km' => 5,  'max_distance_km' => 10,   'fee' => 50,  'is_active' => true, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['label' => 'Mid (10–20 km)',     'min_distance_km' => 10, 'max_distance_km' => 20,   'fee' => 120, 'is_active' => true, 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['label' => 'Far (20–40 km)',     'min_distance_km' => 20, 'max_distance_km' => 40,   'fee' => 250, 'is_active' => true, 'sort_order' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['label' => 'Very Far (40+ km)',  'min_distance_km' => 40, 'max_distance_km' => null, 'fee' => 500, 'is_active' => true, 'sort_order' => 5, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
