<?php

namespace App\Http\Controllers\Manager;
use App\Models\Expense;
use App\Http\Controllers\Controller;
use App\Models\MaterialRequest;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Events\Procurement\MaterialRequestReviewed;
use App\Events\Procurement\PurchaseOrderGenerated;
use App\Events\Procurement\ReplacementRequestReviewed;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ProcurementReviewController extends Controller
{
   public function index()
{
    $requests = MaterialRequest::with([
        'requester',
        'supplier',
        'items.material',
        'purchaseOrder.items.material',
        'purchaseOrder.recorder',
    ])
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($req) {
            // ✅ Server-side computed flag — no frontend null checks needed
            $req->purchase_recorded = $req->purchaseOrder
                && $req->purchaseOrder->actual_total_cost !== null;

            return $req;
        });

    return Inertia::render('Manager/Procurement/ReviewRequests', [
        'requests' => $requests,
    ]);
}

public function show(MaterialRequest $materialRequest)
{
    $materialRequest->load([
        'items.material.category',
        'supplier',
        'requester',
        'purchaseOrder.items.material',
        'purchaseOrder.recorder',
    ]);

    // ✅ Same computed flag
    $materialRequest->purchase_recorded = $materialRequest->purchaseOrder
        && $materialRequest->purchaseOrder->actual_total_cost !== null;

    return Inertia::render('Manager/Procurement/ReviewRequest', [
        'request' => $materialRequest,
    ]);
}



    public function review(Request $request, MaterialRequest $materialRequest)
    {
        $validated = $request->validate([
            'action'  => 'required|in:approve,reject,return',
            'remarks' => 'required_if:action,reject,return|nullable|string',
        ]);

        if (
            $materialRequest->status !== 'pending_review' &&
            $materialRequest->status !== 'returned_for_revision'
        ) {
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

        $message = '';

        switch ($validated['action']) {
            case 'approve':
                $materialRequest->status = 'approved';
                $materialRequest->remarks = $validated['remarks'] ?? null;
                $materialRequest->save();

                if ($materialRequest->type === 'replacement' && $materialRequest->purchase_order_id) {
                    Log::info('Replacement request approved – updating existing PO.');
                    $message = 'Replacement request approved.';
                } else {
                    $supplierId = $materialRequest->procurement_type === 'walk_in_purchase'
                        ? null
                        : $materialRequest->supplier_id;

                    Log::info('PO Supplier ID calculated', [
                        'supplierId' => $supplierId,
                        'procurement_type' => $materialRequest->procurement_type,
                        'supplier_id_from_request' => $materialRequest->supplier_id,
                    ]);

                    try {
                        $po = PurchaseOrder::create([
                            'po_number'            => PurchaseOrder::generatePONumber(),
                            'material_request_id'  => $materialRequest->id,
                            'supplier_id'          => $supplierId,
                            'approved_by'          => Auth::id(),
                            'approved_at'          => now(),
                            'status'               => 'waiting_delivery',
                        ]);

                        Log::info('PO created successfully', [
                            'po_id' => $po->id,
                            'supplier_id' => $po->supplier_id,
                        ]);

                        foreach ($materialRequest->items as $item) {
                            PurchaseOrderItem::create([
                                'purchase_order_id' => $po->id,
                                'material_id'       => $item->material_id,
                                'ordered_quantity'  => $item->quantity,
                                'thickness'         => $item->thickness,
                                'width'             => $item->width,
                                'length'            => $item->length,
                            ]);
                        }

                        event(new PurchaseOrderGenerated($po));
                        $message = "Request approved. Purchase Order #{$po->po_number} generated.";

                    } catch (\Exception $e) {
                        Log::error('PO creation failed', [
                            'error'      => $e->getMessage(),
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
                $message = 'Request rejected.';
                break;

            case 'return':
                $materialRequest->status = 'returned_for_revision';
                $materialRequest->remarks = $validated['remarks'];
                $materialRequest->save();

                event(new MaterialRequestReviewed($materialRequest, 'returned'));
                $message = 'Request returned for revision.';
                break;
        }

        return redirect()->route('manager.procurement.review.index')
            ->with('success', $message);
    }

  /**
 * ✅ Record actual purchase cost for an approved material request.
 * Manager-only. Auto-creates a PO if one doesn't exist yet.
 * Also auto-records an Expense entry linked to the PO.
 */
public function recordPurchase(Request $request, MaterialRequest $materialRequest)
{
    // ── Authorization ──
    $roleSlug = Auth::user()?->role?->slug;
    if ($roleSlug !== 'manager') {
        abort(403);
    }

    // ── Only approved requests ──
    if ($materialRequest->status !== 'approved') {
        return back()->with('error', 'Only approved requests can have their purchase cost recorded.');
    }

    // ── Get existing PO or auto-create one ──
    $po = $materialRequest->purchaseOrder;

    if (!$po) {
        Log::info('[RECORD PURCHASE] No PO found – auto-creating', [
            'material_request_id' => $materialRequest->id,
        ]);

        $supplierId = $materialRequest->procurement_type === 'walk_in_purchase'
            ? null
            : $materialRequest->supplier_id;

        DB::transaction(function () use ($materialRequest, $supplierId, &$po) {
            $po = PurchaseOrder::create([
                'po_number'           => PurchaseOrder::generatePONumber(),
                'material_request_id' => $materialRequest->id,
                'supplier_id'         => $supplierId,
                'approved_by'         => $materialRequest->reviewed_by ?? Auth::id(),
                'approved_at'         => $materialRequest->reviewed_at ?? now(),
                'status'              => 'waiting_delivery',
            ]);

            foreach ($materialRequest->items as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'material_id'       => $item->material_id,
                    'ordered_quantity'  => $item->quantity,
                    'thickness'         => $item->thickness,
                    'width'             => $item->width,
                    'length'            => $item->length,
                ]);
            }
        });

        $po = $po->fresh(['items']);
    }

    // ── Prevent double recording ──
    if ($po->actual_total_cost !== null) {
        return back()->with('error', 'Purchase cost has already been recorded for this request.');
    }

    // ── Validate ──
    $validated = $request->validate([
        'items'                    => 'required|array|min:1',
        'items.*.material_id'      => 'required|integer|exists:materials,id',
        'items.*.actual_unit_cost' => 'required|numeric|min:0',
    ]);

    DB::beginTransaction();
    try {
        $total = 0;

        foreach ($validated['items'] as $row) {
            // ✅ Lookup by material_id within this PO
            $item = PurchaseOrderItem::where('purchase_order_id', $po->id)
                ->where('material_id', $row['material_id'])
                ->first();

            if (!$item) {
                throw new \Exception(
                    "PO item not found for material ID {$row['material_id']}"
                );
            }

            $subtotal = (float) $item->ordered_quantity * (float) $row['actual_unit_cost'];

            $item->actual_unit_cost = $row['actual_unit_cost'];
            $item->actual_subtotal  = $subtotal;
            $item->save();

            $total += $subtotal;
        }

        // ── Save PO totals ──
        $po->actual_total_cost    = $total;
        $po->purchase_recorded_at = now();
        $po->purchase_recorded_by = Auth::id();
        $po->save();

        // ═══════════════════════════════════════════════════════
        // ✅ AUTO-CREATE THE EXPENSE RECORD
        // ═══════════════════════════════════════════════════════
        // Reload relations to ensure we have supplier and materialRequest loaded
        $po->loadMissing(['materialRequest', 'supplier']);

        $descriptionParts = [
            "Purchase Order #{$po->po_number}",
        ];

        if ($po->materialRequest) {
            $descriptionParts[] = "for Material Request #{$po->materialRequest->request_no}";
        }

        if ($po->supplier) {
            $descriptionParts[] = "· Supplier: {$po->supplier->name}";
        }

        $expense = Expense::updateOrCreate(
            ['purchase_order_id' => $po->id],   // unique key — prevents duplicates
            [
                'category'         => 'supplier_purchase',
                'description'      => implode(' ', $descriptionParts),
                'amount'           => $total,
                'expense_date'     => now()->toDateString(),
                'recorded_by'      => Auth::id(),
                'reference_number' => $po->po_number,
            ]
        );

        Log::info('[RECORD PURCHASE] Expense record created/updated', [
            'expense_id'        => $expense->id,
            'purchase_order_id' => $po->id,
            'po_number'         => $po->po_number,
            'category'          => 'supplier_purchase',
            'amount'            => $total,
            'expense_date'      => now()->toDateString(),
        ]);

        // ═══════════════════════════════════════════════════════

        DB::commit();

        Log::info('[RECORD PURCHASE] Saved', [
            'material_request_id' => $materialRequest->id,
            'purchase_order_id'   => $po->id,
            'total'               => $total,
            'recorded_by'         => Auth::id(),
        ]);

        return redirect()->route('manager.procurement.review.index')
            ->with('success', 'Purchase cost recorded. Total: ₱' . number_format($total, 2));

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('[RECORD PURCHASE] Failed', [
            'material_request_id' => $materialRequest->id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        return back()->with('error', 'Failed to record purchase cost. ' . $e->getMessage());
    }
}






}
