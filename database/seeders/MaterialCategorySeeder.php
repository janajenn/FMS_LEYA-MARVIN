<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MaterialCategory;

class MaterialCategorySeeder extends Seeder
{
    public function run()
    {
        $categories = [
            ['name' => 'Wood', 'description' => 'Lumber and wood products'],
            ['name' => 'Nails', 'description' => 'Various nail sizes'],
            ['name' => 'Varnish', 'description' => 'Wood finishes'],
            ['name' => 'Screws', 'description' => 'Screws of different sizes'],
            ['name' => 'Glue', 'description' => 'Adhesives for furniture'],
            ['name' => 'Other', 'description' => 'Miscellaneous materials'],
        ];

        foreach ($categories as $cat) {
            MaterialCategory::create($cat);
        }
    }
}
