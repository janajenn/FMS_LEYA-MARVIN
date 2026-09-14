<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\Models\Supplier;
use App\Events\Procurement\MaterialRequestSubmitted;
use App\Events\Procurement\ReplacementRequestSubmitted;
use App\Models\MaterialCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class MaterialRequestController extends Controller
{
    public function index()
    {
        $requests = MaterialRequest::with(['requester', 'supplier', 'items.material'])
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('Admin/Procurement/MaterialRequests/Index', ['requests' => $requests]);
    }

   public function create(Request $request)
{
    $materials = Material::with('category')->where('status', 'active')->get();
    $suppliers = Supplier::all();
    $categories = MaterialCategory::all();

    $prefill = session()->get('replacement_prefill', []);

    return Inertia::render('Admin/Procurement/MaterialRequests/Create', [
        'materials' => $materials,
        'suppliers' => $suppliers,
        'categories' => $categories,
        'prefill' => $prefill,
    ]);
}

    public function store(Request $request)
{
    $validated = $request->validate([
        'procurement_type' => 'required|in:supplier_purchase,walk_in_purchase',
        'supplier_id' => 'required_if:procurement_type,supplier_purchase|nullable|exists:suppliers,id',
        'reason' => 'required|string',
        'items' => 'required|array|min:1',
        'items.*.material_id' => 'required|exists:materials,id',
        'items.*.quantity' => 'required|numeric|min:0.01',
        'items.*.thickness' => 'nullable|numeric|min:0',
        'items.*.width' => 'nullable|numeric|min:0',
        'items.*.length' => 'nullable|numeric|min:0',
        'items.*.notes' => 'nullable|string',
        // ✅ new: type and purchase_order_id (both optional)
        'type' => 'sometimes|in:regular,replacement',
        'purchase_order_id' => 'nullable|exists:purchase_orders,id',
    ]);

    $requestNo = MaterialRequest::generateRequestNumber();

    $materialRequest = MaterialRequest::create([
        'request_no' => $requestNo,
        'requested_by' => Auth::id(),
        'procurement_type' => $validated['procurement_type'],
        'supplier_id' => $validated['supplier_id'] ?? null,
        'reason' => $validated['reason'],
        'status' => 'pending_review',
        'type' => $validated['type'] ?? 'regular',
        'purchase_order_id' => $validated['purchase_order_id'] ?? null,
    ]);

    foreach ($validated['items'] as $item) {
        MaterialRequestItem::create([
            'material_request_id' => $materialRequest->id,
            'material_id' => $item['material_id'],
            'quantity' => $item['quantity'],
            'thickness' => $item['thickness'] ?? null,
            'width' => $item['width'] ?? null,
            'length' => $item['length'] ?? null,
            'notes' => $item['notes'] ?? null,
        ]);
    }

     // Dispatch event based on type
    if ($materialRequest->type === 'replacement') {
        event(new ReplacementRequestSubmitted($materialRequest));
    } else {
        event(new MaterialRequestSubmitted($materialRequest));
    }

    return redirect()->route('admin.material-requests.index')
        ->with('success', "Request #{$requestNo} created successfully.");
}

    public function show(MaterialRequest $materialRequest)
    {
        $materialRequest->load(['items.material.category', 'supplier', 'requester']);
        return Inertia::render('Admin/Procurement/MaterialRequests/Show', [
            'request' => $materialRequest,
        ]);
    }

    public function destroy(MaterialRequest $materialRequest)
    {
        if ($materialRequest->status !== 'pending_review') {
            return back()->with('error', 'Cannot delete a request that is already reviewed.');
        }
        $materialRequest->delete();
        return redirect()->route('admin.material-requests.index')
            ->with('success', 'Material request deleted.');
    }

    public function edit(MaterialRequest $materialRequest)
{
    // Only allow if status is returned_for_revision
    if ($materialRequest->status !== 'returned_for_revision') {
        return redirect()->route('admin.material-requests.index')
            ->with('error', 'This request cannot be revised.');
    }

    $materialRequest->load('items.material');
    $materials = Material::with('category')->where('status', 'active')->get();
    $suppliers = Supplier::all();
    $categories = MaterialCategory::all();

    return Inertia::render('Admin/Procurement/MaterialRequests/Edit', [
        'request' => $materialRequest,
        'materials' => $materials,
        'suppliers' => $suppliers,
        'categories' => $categories,
    ]);
}

public function update(Request $request, MaterialRequest $materialRequest)
{
    // Only allow if status is returned_for_revision
    if ($materialRequest->status !== 'returned_for_revision') {
        return redirect()->route('admin.material-requests.index')
            ->with('error', 'This request cannot be updated.');
    }

    $validated = $request->validate([
        'procurement_type' => 'required|in:supplier_purchase,walk_in_purchase',
        'supplier_id' => 'required_if:procurement_type,supplier_purchase|nullable|exists:suppliers,id',
        'reason' => 'required|string',
        'items' => 'required|array|min:1',
        'items.*.material_id' => 'required|exists:materials,id',
        'items.*.quantity' => 'required|numeric|min:0.01',
        'items.*.thickness' => 'nullable|numeric|min:0',
        'items.*.width' => 'nullable|numeric|min:0',
        'items.*.length' => 'nullable|numeric|min:0',
        'items.*.notes' => 'nullable|string',
    ]);

    // Update request fields
    $materialRequest->update([
        'procurement_type' => $validated['procurement_type'],
        'supplier_id' => $validated['supplier_id'] ?? null,
        'reason' => $validated['reason'],
        'status' => 'pending_review', // reset to pending
        'reviewed_by' => null,        // clear review data
        'reviewed_at' => null,
        'remarks' => null,            // clear remarks
    ]);

    // Delete old items and recreate (simple approach)
    $materialRequest->items()->delete();
    foreach ($validated['items'] as $item) {
        MaterialRequestItem::create([
            'material_request_id' => $materialRequest->id,
            'material_id' => $item['material_id'],
            'quantity' => $item['quantity'],
            'thickness' => $item['thickness'] ?? null,
            'width' => $item['width'] ?? null,
            'length' => $item['length'] ?? null,
            'notes' => $item['notes'] ?? null,
        ]);
    }

    return redirect()->route('admin.material-requests.index')
        ->with('success', "Request #{$materialRequest->request_no} revised and resubmitted for review.");
}
}
