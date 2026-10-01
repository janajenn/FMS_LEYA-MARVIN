<?php

namespace App\Http\Controllers\Customer;

use App\Models\Product;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

class ProductController extends Controller
{
    /**
     * Shared units payload — single source of truth for the frontend.
     */
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
                'images'    => fn ($q) => $q->whereNull('variant_id')->orderBy('sort_order'),
                'parts',
                'finishes',
                'variants'  => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
                'variants.images',
            ])
            ->firstOrFail();

        return Inertia::render('Customer/Shop/Show', [
            'product' => $product,
            'units'   => $this->unitProps(),
        ]);
    }
}
