<?php

namespace App\Http\Controllers\Admin;

use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

class ProductCategoryController extends Controller
{
    public function index()
    {
        $categories = ProductCategory::all();
        return Inertia::render('Admin/ProductCategories/Index', ['categories' => $categories]);
    }

    public function create()
    {
        return Inertia::render('Admin/ProductCategories/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:product_categories',
            'description' => 'nullable|string',
        ]);
        ProductCategory::create($validated);
        return redirect()->route('product-categories.index')->with('success', 'Category created.');
    }

    public function edit(ProductCategory $productCategory)
    {
        return Inertia::render('Admin/ProductCategories/Edit', ['category' => $productCategory]);
    }

    public function update(Request $request, ProductCategory $productCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:product_categories,name,'.$productCategory->id,
            'description' => 'nullable|string',
        ]);
        $productCategory->update($validated);
        return redirect()->route('product-categories.index')->with('success', 'Category updated.');
    }

    public function destroy(ProductCategory $productCategory)
    {
        $productCategory->delete();
        return redirect()->route('product-categories.index')->with('success', 'Category deleted.');
    }
}
