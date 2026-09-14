<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductCategory;

class ProductCategorySeeder extends Seeder
{
    public function run()
    {
        $categories = [
            ['name' => 'Dining Tables', 'description' => 'Tables for dining rooms'],
            ['name' => 'Sofas', 'description' => 'Comfortable seating'],
            ['name' => 'Cabinets', 'description' => 'Storage cabinets'],
            ['name' => 'Chairs', 'description' => 'Chairs for various uses'],
            ['name' => 'Bed Frames', 'description' => 'Bed frames and headboards'],
        ];
        foreach ($categories as $cat) {
            ProductCategory::create($cat);
        }
    }
}
