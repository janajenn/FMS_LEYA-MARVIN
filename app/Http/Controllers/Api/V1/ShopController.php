<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ProductResource;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\DeliveryZone;

class ShopController extends Controller
{
    /**
     * Paginated list of active products.
     */
    public function index()
    {
        $products = Product::with(['category', 'images'])
            ->where('status', 'active')
            ->orderByDesc('created_at')
            ->paginate(15);

        return ProductResource::collection($products);
    }

    /**
     * Single product by slug (or numeric ID as fallback).
     */
      public function show(string $slug)
    {
        $product = Product::where('slug', $slug)
            ->with([
                'category',
                'images'          => fn ($q) => $q->whereNull('variant_id')->orderBy('sort_order'),
                'parts',
                'finishes',
                'variants'        => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
                'variants.images',
            ])
            ->where('status', 'active')
            ->firstOrFail();

        return new ProductResource($product);
    }

    /**
     * All product categories.
     */
    public function categories()
    {
        $categories = ProductCategory::orderBy('name')->get(['id', 'name']);

        return response()->json(['data' => $categories]);
    }

    /**
     * Active delivery zones.
     */
    public function deliveryZones()
    {
        $zones = DeliveryZone::where('is_active', true)
            ->get(['id', 'name', 'fee_type', 'fee', 'estimated_days']);

        return response()->json(['data' => $zones]);
    }
}
