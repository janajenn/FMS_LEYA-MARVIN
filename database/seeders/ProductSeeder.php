<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Material;

class ProductSeeder extends Seeder
{
    public function run()
    {
        $category = ProductCategory::where('slug', 'dining-tables')->first();
        if ($category) {
            $product = Product::create([
                'category_id' => $category->id,
                'name' => 'Classic Wood Dining Table',
                'description' => 'A beautiful solid wood dining table.',
                'price' => 450.00,
                'stock_quantity' => 10,
                'is_customizable' => true,
                'status' => 'active',
            ]);
            // Attach materials if needed
            $wood = Material::where('name', 'Mahogany')->first();
            if ($wood) {
                $product->materials()->attach($wood->id, ['quantity' => 20, 'unit' => 'board feet']);
            }
        }
    }
}
