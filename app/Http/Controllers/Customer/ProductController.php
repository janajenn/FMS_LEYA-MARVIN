<?php

namespace App\Http\Controllers\Customer;

use App\Models\Product;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

class ProductController extends Controller
{
    private function unitProps(): array
    {
        return [
            'dimension'      => config('units.dimension'),
            'dimensionShort' => config('units.dimension_short'),
            'dimensionLabel' => config('units.dimension_label'),
        ];
    }

    public function index()
    {
        $products = Product::with(['category', 'images'])
                    ->where('status', 'active')
                    ->get();

        return Inertia::render('Customer/Shop/Index', [
            'products' => $products,
            'units'    => $this->unitProps(),
        ]);
    }

    public function show($slug)
    {
        $product = Product::where('slug', $slug)
            ->with([
                'category',
                'images' => function ($q) {
                    $q->whereNull('variant_id')->orderBy('sort_order');
                },
                'parts' => function ($q) {
                    $q->orderBy('sort_order');
                },
                'parts.designs' => function ($q) {
                    $q->where('is_active', true)->orderBy('sort_order');
                },
                'variants' => function ($q) {
                    $q->where('is_active', true)->orderBy('sort_order');
                },
                'variants.images',
                'finishMaterial',
            ])
            ->firstOrFail();

        return Inertia::render('Customer/Shop/Show', [
            'product' => $product,
            'units'   => $this->unitProps(),
        ]);
    }
}
