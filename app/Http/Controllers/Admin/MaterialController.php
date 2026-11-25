<?php

namespace App\Http\Controllers\Admin;

use App\Models\Material;
use App\Models\MaterialCategory;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

class MaterialController extends Controller
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
            'units'      => $this->unitProps(),
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
            'is_finish' => 'sometimes|boolean',
        ]);

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
            'units'      => $this->unitProps(),
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
            'is_finish' => 'sometimes|boolean',
        ]);

        $validated['is_finish'] = $validated['is_finish'] ?? false;

        $material->update($validated);

        return redirect()->route('admin.materials.index')->with('success', 'Material updated successfully.');
    }

 public function destroy(Material $material)
{
    // Check every FK that could block this
    $blocking = [];

    $mrCount = \DB::table('material_request_items')->where('material_id', $material->id)->count();
    if ($mrCount > 0) $blocking[] = "{$mrCount} material request item(s)";

    $poCount = \DB::table('purchase_order_items')->where('material_id', $material->id)->count();
    if ($poCount > 0) $blocking[] = "{$poCount} purchase order item(s)";

    $shCount = \DB::table('stock_history')->where('material_id', $material->id)->count();
    if ($shCount > 0) $blocking[] = "{$shCount} stock history record(s)";

    $varCount = \DB::table('product_variants')->where('material_id', $material->id)->count();
    if ($varCount > 0) $blocking[] = "{$varCount} product variant(s)";

    $finCount = \DB::table('products')->where('finish_material_id', $material->id)->count();
    if ($finCount > 0) $blocking[] = "{$finCount} product(s) using it as finish";

    if (!empty($blocking)) {
        return back()->with('error',
            "Cannot delete '{$material->name}' — it's still used by: " . implode(', ', $blocking) . ". " .
            "Archive or rename it instead, or remove the referencing records first."
        );
    }

    // Safe to delete
    try {
        $material->delete();
        return back()->with('success', "Material '{$material->name}' deleted.");
    } catch (\Illuminate\Database\QueryException $e) {
        return back()->with('error', 'Cannot delete: ' . $e->getMessage());
    }
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
