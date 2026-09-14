<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Material;
use App\Models\MaterialCategory;
use App\Models\Supplier;

class MaterialSeeder extends Seeder
{
    public function run()
    {
        $wood = MaterialCategory::where('slug', 'wood')->first();
        $nails = MaterialCategory::where('slug', 'nails')->first();
        $supplier1 = Supplier::first();

        if ($wood) {
            Material::create([
                'category_id' => $wood->id,
                'name' => 'Mahogany',
                'unit' => 'board feet',
                'cost' => 45.50,
                'stock_quantity' => 100,
                'attributes' => ['length' => 8, 'width' => 6, 'thickness' => 1],
                'supplier_id' => $supplier1->id,
            ]);
            // add others...
        }
    }
}
