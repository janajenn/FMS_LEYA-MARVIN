<?php

namespace App\Http\Controllers\Admin;

use App\Models\Material;
use App\Models\MaterialCategory;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

class MaterialController extends Controller
{
    public function index()
    {
        $materials = Material::with(['category', 'supplier'])->get();
        return Inertia::render('Admin/Materials/Index', ['materials' => $materials]);
    }

    public function create()
    {
        $categories = MaterialCategory::all();
        $suppliers = Supplier::all();
        return Inertia::render('Admin/Materials/Create', [
            'categories' => $categories,
            'suppliers' => $suppliers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:material_categories,id',
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'cost' => 'required|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'procurement_type' => 'required|in:supplier_purchase,walk_in_purchase',
            'reorder_level' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',
            'attributes' => 'nullable|array',
            // ✅ NEW: add is_finish validation
            'is_finish' => 'sometimes|boolean',
        ]);

        // Merge default stock_quantity and is_finish (if not present, default false)
        $materialData = array_merge($validated, [
            'stock_quantity' => 0,
            'is_finish' => $validated['is_finish'] ?? false,
        ]);

        $material = Material::create($materialData);

        return redirect()->route('admin.materials.index')->with('success', 'Material created successfully.');
    }

    public function edit(Material $material)
    {
        $categories = MaterialCategory::all();
        $suppliers = Supplier::all();
        return Inertia::render('Admin/Materials/Edit', [
            'material' => $material->load('category'),
            'categories' => $categories,
            'suppliers' => $suppliers,
        ]);
    }

    public function update(Request $request, Material $material)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:material_categories,id',
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'cost' => 'required|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'procurement_type' => 'required|in:supplier_purchase,walk_in_purchase',
            'reorder_level' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',
            'attributes' => 'nullable|array',
            // ✅ NEW: add is_finish validation
            'is_finish' => 'sometimes|boolean',
        ]);

        // Ensure is_finish is set (default false if not provided)
        $validated['is_finish'] = $validated['is_finish'] ?? false;

        $material->update($validated);

        return redirect()->route('admin.materials.index')->with('success', 'Material updated successfully.');
    }

    public function destroy(Material $material)
    {
        $material->delete();
        return redirect()->route('admin.materials.index')->with('success', 'Material deleted successfully.');
    }

    public function stockHistory(Material $material)
    {
        $history = $material->stockHistory()->with('creator')->orderBy('created_at', 'desc')->get();
        return Inertia::render('Admin/Materials/StockHistory', [
            'material' => $material,
            'history' => $history,
        ]);
    }
}
