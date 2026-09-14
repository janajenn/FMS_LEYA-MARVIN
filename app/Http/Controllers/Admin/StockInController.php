<?php

namespace App\Http\Controllers\Admin;

use App\Models\Material;
use App\Models\StockIn;
use App\Models\Supplier;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

class StockInController extends Controller
{
    /**
     * Display a list of stock‑in records from confirmed Goods Receipts.
     */
public function index()
{
    $stockEntries = StockHistory::with([
        'material',
        'creator',
        'goodsReceipt.purchaseOrder',
        'goodsReceipt.receiver'
    ])
    ->where('reference_type', 'goods_receipt')
    ->orderBy('created_at', 'desc')
    ->get();

    // ✅ Ensure goodsReceipt is loaded; if not, load manually (fallback)
    foreach ($stockEntries as $entry) {
        if ($entry->goodsReceipt === null && $entry->reference_id) {
            // Try to load it manually (should not happen if data is clean)
            $entry->load(['goodsReceipt.purchaseOrder', 'goodsReceipt.receiver']);
        }
        // Pre-compute status for frontend
        $entry->status = $entry->goods_receipt_status;
    }

    return Inertia::render('Admin/StockIn/Index', [
        'stockEntries' => $stockEntries,
    ]);
}
    /**
     * Show the form for manual stock‑in (legacy/for adjustments).
     * This route is kept but not linked in the main navigation.
     */
    public function create()
    {
        $materials = Material::with('category')->get();
        $suppliers = Supplier::all();
        return Inertia::render('Admin/StockIn/Create', [
            'materials' => $materials,
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Store a manual stock‑in record.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'required|numeric|min:0',
            'date_received' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['total_cost'] = $validated['quantity'] * $validated['unit_cost'];

        $stockIn = StockIn::create($validated);

        $material = Material::find($validated['material_id']);
        $oldStock = $material->stock_quantity;
        $newStock = $oldStock + $validated['quantity'];
        $material->stock_quantity = $newStock;
        $material->save();

        StockHistory::create([
            'material_id' => $material->id,
            'reference_type' => 'stock_in',
            'reference_id' => $stockIn->id,
            'quantity_change' => $validated['quantity'],
            'previous_quantity' => $oldStock,
            'new_quantity' => $newStock,
            'note' => 'Manual stock-in',
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('admin.materials.index')->with('success', 'Stock-in recorded.');
    }
}
