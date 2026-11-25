<?php

namespace App\Http\Controllers\Admin;
use Illuminate\Support\Facades\DB;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::all();
        return Inertia::render('Admin/Suppliers/Index', ['suppliers' => $suppliers]);
    }

    public function create()
    {
        return Inertia::render('Admin/Suppliers/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);
        Supplier::create($validated);
       return redirect()->route('admin.suppliers.index')->with('success', 'Supplier added.');
    }

    public function edit(Supplier $supplier)
    {
        return Inertia::render('Admin/Suppliers/Edit', ['supplier' => $supplier]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);
        $supplier->update($validated);
       return redirect()->route('admin.suppliers.index')->with('success', 'Supplier updated.');
    }

   public function destroy(Supplier $supplier)
{
    // Check every FK that could block this delete
    $blocking = [];

    $poCount = \DB::table('purchase_orders')->where('supplier_id', $supplier->id)->count();
    if ($poCount > 0) $blocking[] = "{$poCount} purchase order(s)";

    $matCount = \DB::table('materials')->where('supplier_id', $supplier->id)->count();
    if ($matCount > 0) $blocking[] = "{$matCount} material record(s)";

    $mrCount = \DB::table('material_requests')->where('supplier_id', $supplier->id)->count();
    if ($mrCount > 0) $blocking[] = "{$mrCount} material request(s)";

    $siCount = \DB::table('stock_ins')->where('supplier_id', $supplier->id)->count();
    if ($siCount > 0) $blocking[] = "{$siCount} stock-in record(s)";

    if (!empty($blocking)) {
        return back()->with('error',
            "Cannot delete '{$supplier->name}' — it's still referenced by: " . implode(', ', $blocking) . ". " .
            "Archive it instead, or remove the referencing records first."
        );
    }

    try {
        $supplier->delete();
    } catch (\Illuminate\Database\QueryException $e) {
        // Safety net — catches any FK we didn't anticipate
        return back()->with('error',
            "Cannot delete '{$supplier->name}': " . $e->getMessage()
        );
    }

    return redirect()->route('admin.suppliers.index')->with('success', 'Supplier deleted.');
}
}
