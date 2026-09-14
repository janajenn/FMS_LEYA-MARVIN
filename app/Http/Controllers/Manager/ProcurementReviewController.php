<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\MaterialRequest;
use App\Models\PurchaseOrder;
use App\Events\Procurement\MaterialRequestReviewed;
use App\Events\Procurement\PurchaseOrderGenerated;
use App\Events\Procurement\ReplacementRequestReviewed;
use App\Models\PurchaseOrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use  inertia\Inertia;

use Illuminate\Support\Facades\Auth;

class ProcurementReviewController extends Controller
{
   public function index()
{
    // Get ALL material requests with relations, ordered by latest
    $requests = MaterialRequest::with(['requester', 'supplier', 'items.material'])
        ->orderBy('created_at', 'desc')
        ->get();
    return Inertia::render('Manager/Procurement/ReviewRequests', ['requests' => $requests]);
}

    public function show(MaterialRequest $materialRequest)
    {
        $materialRequest->load(['items.material.category', 'supplier', 'requester', 'purchaseOrder']);
        return Inertia::render('Manager/Procurement/ReviewRequest', ['request' => $materialRequest]);
    }



public function review(Request $request, MaterialRequest $materialRequest)
{
    $validated = $request->validate([
        'action' => 'required|in:approve,reject,return',
        'remarks' => 'required_if:action,reject,return|nullable|string',
    ]);

    if ($materialRequest->status !== 'pending_review' && $materialRequest->status !== 'returned_for_revision') {
        return back()->with('error', 'This request cannot be reviewed.');
    }

    Log::info('===== Review Started =====', [
        'request_id' => $materialRequest->id,
        'action' => $validated['action'],
        'procurement_type' => $materialRequest->procurement_type,
        'supplier_id_from_request' => $materialRequest->supplier_id,
        'status' => $materialRequest->status,
    ]);

    $materialRequest->reviewed_by = Auth::id();
    $materialRequest->reviewed_at = now();

    switch ($validated['action']) {
        case 'approve':
            $materialRequest->status = 'approved';
            $materialRequest->remarks = $validated['remarks'] ?? null;
            $materialRequest->save();

            if ($materialRequest->type === 'replacement' && $materialRequest->purchase_order_id) {
                // ... replacement handling (will restore later) ...
                Log::info('Replacement request approved – updating existing PO.');
            } else {
                // Determine supplier_id
                $supplierId = $materialRequest->procurement_type === 'walk_in_purchase'
                    ? null
                    : $materialRequest->supplier_id;

                Log::info('PO Supplier ID calculated', [
                    'supplierId' => $supplierId,
                    'procurement_type' => $materialRequest->procurement_type,
                    'supplier_id_from_request' => $materialRequest->supplier_id,
                ]);

                // Before creating PO, check column info
                $columnInfo = DB::select('DESCRIBE purchase_orders');
                foreach ($columnInfo as $col) {
                    if ($col->Field === 'supplier_id') {
                        Log::info('supplier_id column info', [
                            'Null' => $col->Null,
                            'Default' => $col->Default,
                        ]);
                    }
                }

                try {
                    $po = PurchaseOrder::create([
                        'po_number' => PurchaseOrder::generatePONumber(),
                        'material_request_id' => $materialRequest->id,
                        'supplier_id' => $supplierId,
                        'approved_by' => Auth::id(),
                        'approved_at' => now(),
                        'status' => 'waiting_delivery',
                    ]);

                    Log::info('PO created successfully', ['po_id' => $po->id, 'supplier_id' => $po->supplier_id]);

                    foreach ($materialRequest->items as $item) {
                        PurchaseOrderItem::create([
                            'purchase_order_id' => $po->id,
                            'material_id' => $item->material_id,
                            'ordered_quantity' => $item->quantity,
                            'thickness' => $item->thickness,
                            'width' => $item->width,
                            'length' => $item->length,
                        ]);
                    }

                    event(new PurchaseOrderGenerated($po));
                    $message = "Request approved. Purchase Order #{$po->po_number} generated.";

                } catch (\Exception $e) {
                    Log::error('PO creation failed', [
                        'error' => $e->getMessage(),
                        'supplierId' => $supplierId,
                    ]);
                    throw $e;
                }
            }
            break;

            case 'reject':
                $materialRequest->status = 'rejected';
                $materialRequest->remarks = $validated['remarks'];
                $materialRequest->save();

                if ($materialRequest->type === 'replacement') {
                    event(new ReplacementRequestReviewed($materialRequest, 'rejected'));
                } else {
                    event(new MaterialRequestReviewed($materialRequest, 'rejected'));
                }
                $message = "Request rejected.";
                break;

            case 'return':
                $materialRequest->status = 'returned_for_revision';
                $materialRequest->remarks = $validated['remarks'];
                $materialRequest->save();

                event(new MaterialRequestReviewed($materialRequest, 'returned'));
                $message = "Request returned for revision.";
                break;
        }

        DB::commit();

        return redirect()->route('manager.procurement.review.index')
            ->with('success', $message);

}


}
