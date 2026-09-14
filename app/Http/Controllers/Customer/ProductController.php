<?php

namespace App\Http\Controllers\Customer;

use App\Models\Product;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with(['category', 'images'])
                    ->where('status', 'active')
                    ->get();
        return Inertia::render('Customer/Shop/Index', ['products' => $products]);
    }

  public function show($slug)
{
    $product = Product::where('slug', $slug)
        ->with(['category', 'images', 'parts', 'finishes']) // ✅ add 'finishes'
        ->firstOrFail();
    return Inertia::render('Customer/Shop/Show', ['product' => $product]);
}


}
