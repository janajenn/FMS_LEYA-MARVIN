<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Inertia\Inertia;
use App\Services\DeliveryAssignmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with(['user', 'items.product', 'payments'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Orders/Index', ['orders' => $orders]);
    }

    public function show(Order $order)
{
    $order->load([
        'user',
        'items.product.images',
        'items.product.parts.designs',
        'items.product.finishMaterial',
        'items.variant.images',
        'items.assignedEmployee',
        'payments',
        'delivery',
    ]);

    foreach ($order->items as $item) {
        // ── Hero image ──
        $item->display_image_path =
            $item->variant?->images->firstWhere('is_primary', true)?->path
            ?? $item->variant?->images->first()?->path
            ?? $item->product?->images->first()?->path
            ?? null;

        // ── Finish ──
        $finishOption = $item->finish_option
            ?? ($item->customization_data['finish_option'] ?? 'ordinary');
        if ($finishOption === 'standard') {
            $matName = $item->product?->finishMaterial?->name ?? 'Varnish';
            $item->finish_label = "Standard ({$matName})";
        } else {
            $item->finish_label = 'Ordinary (No varnish)';
        }
        $item->finish_option_resolved = $finishOption;

        // ── Price summary (mirror cart) ──
        $breakdown = $item->customization_breakdown ?? [];
        $item->finish_surcharge       = (float) ($breakdown['finish_surcharge']       ?? $item->finish_surcharge ?? 0);
        $item->design_surcharge       = (float) ($breakdown['design_surcharge']       ?? 0);
        $item->material_cost_diff     = (float) ($breakdown['material_cost_diff']     ?? 0);
        $item->material_cost_standard = (float) ($breakdown['material_cost_standard'] ?? 0);
        $item->material_cost_custom   = (float) ($breakdown['material_cost_custom']   ?? 0);
        $item->markup_percent         = (float) ($breakdown['markup_percent']         ?? 0);

        $item->unit_price_with_labor          = (float) $item->price;
        $item->customization_surcharge_total  = (float) ($item->customization_surcharge ?? 0);
        $item->line_total = $item->unit_price_with_labor * $item->quantity
                          + $item->customization_surcharge_total;

        // ── Normalize customization_data (flat OR nested) ──
        $customData = $item->customization_data ?? [];
        $partsData = !empty($customData['parts']) && is_array($customData['parts'])
            ? $customData['parts']
            : [];
        if (empty($partsData)) {
            foreach ($customData as $k => $v) {
                if (is_numeric($k) && is_array($v)) $partsData[$k] = $v;
            }
        }

        // ── Build the FULL parts list — includes every part on the product ──
        $partsList = [];
        if ($item->product) {
            foreach ($item->product->parts as $part) {
                $pData = $partsData[$part->id] ?? null;

                // Design — prefer customer's pick, else fall back to product default
                $designId = $pData['design_id'] ?? null;
                $design = null;
                if ($designId) {
                    $design = $part->designs->firstWhere('id', $designId);
                }
                if (!$design && $part->designs->count() > 0) {
                    $design = $part->designs->firstWhere('is_default', true)
                        ?? $part->designs->first();
                }

                // Dimensions — only the fields this part actually enables
                $enabledFields = $part->dimension_fields ?? [];
                $dims = [];
                $hasChangedDim = false;
                $partDimCost = 0.0;

                foreach ($enabledFields as $f) {
                    $standard = $part->{"standard_{$f}"};
                    $custom   = $pData[$f] ?? null;
                    if ($standard === null && $custom === null) continue;

                    $stdF  = $standard !== null ? (float) $standard : null;
                    $custF = $custom   !== null ? (float) $custom   : $stdF;
                    $changed = $stdF !== null && $custF !== null && abs($stdF - $custF) > 0.001;

                    if ($changed) {
                        $hasChangedDim = true;
                        $rate = (float) ($part->dimension_pricing[$f] ?? 0);
                        if ($custF > $stdF) $partDimCost += ($custF - $stdF) * $rate;
                    }

                    $dims[] = [
                        'field'    => $f,
                        'standard' => $stdF,
                        'custom'   => $custF,
                        'changed'  => $changed,
                    ];
                }

                $designIsNonDefault = $design && !$design->is_default;
                $isCustomized = $hasChangedDim || $designIsNonDefault;

                $partsList[] = [
                    'part_id'           => $part->id,
                    'part_name'         => $part->name,
                    'reference_image'   => $part->reference_image,
                    'design_name'       => $design?->name,
                    'design_image_path' => $design?->image_path,
                    'design_is_default' => (bool) ($design?->is_default ?? false),
                    'design_cost'       => $designIsNonDefault ? (float) $design->additional_cost : 0.0,
                    'dimensions'        => $dims,
                    'dimension_cost'    => round($partDimCost, 2),
                    'is_customized'     => $isCustomized,
                    'allow_design'      => (bool) $part->allow_design_selection,
                    'is_customizable'   => (bool) $part->is_customizable,
                ];
            }
        }

        $item->parts_breakdown         = $partsList;
        $item->customized_parts_count  = collect($partsList)->where('is_customized', true)->count();
        $item->has_parts               = count($partsList) > 0;
        $item->has_any_customization   = $item->customized_parts_count > 0 || $item->finish_option_resolved === 'standard';
    }

    return Inertia::render('Admin/Orders/Show', [
        'order'     => $order,
        'employees' => \App\Models\Employee::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'position']),
    ]);
}


    /**
     * UPDATE ORDER STATUS
     * Validates the new status, applies guards:
     *   - cannot ship unless production is complete,
     *   - starting "processing" auto-sets production_stage = 'carpentry'.
     * Saves the order; if it became "shipped", triggers delivery assignment.
     */

    public function updateStatus(Request $request, Order $order, DeliveryAssignmentService $deliveryService)
    {
        $request->validate([
            'status' => 'required|in:pending,accepted,processing,shipped,delivered,cancelled',
        ]);

        $newStatus = $request->status;

        if ($newStatus === 'shipped' && $order->status === 'processing') {
            if (!$order->isProductionComplete()) {
                return back()->withErrors(['status' => 'Cannot ship order until production is completed.']);
            }
        }

        if ($newStatus === 'processing' && !$order->production_stage) {
            $order->production_stage = 'carpentry';
        }

        $order->status = $newStatus;
        $order->save();

        if ($newStatus === 'shipped') {
            $deliveryService->assignForOrder($order);
        }

        return redirect()->back()->with('success', 'Order status updated.');
    }


        /**
     * UPDATE PRODUCTION STAGE
     * Enforces workflow rules:
     *   - only allowed while status is "processing",
     *   - production must not already be completed,
     *   - stage cannot move backwards.
     * Saves the new production_stage.
     */

    public function updateProductionStage(Request $request, Order $order)
    {
        $request->validate([
            'stage' => 'required|in:' . implode(',', Order::getProductionStages()),
        ]);

        if ($order->status !== 'processing') {
            return back()->withErrors(['stage' => 'Production stages can only be updated when order is in Processing.']);
        }

        $newStage = $request->stage;
        $stages = Order::getProductionStages();
        $currentIndex = $order->getCurrentStageIndex();

        $newIndex = array_search($newStage, $stages);
        if ($newIndex === false) {
            return back()->withErrors(['stage' => 'Invalid stage.']);
        }

        if ($order->production_stage === 'completed') {
            return back()->withErrors(['stage' => 'Production is already completed.']);
        }

        if ($newIndex <= $currentIndex && $currentIndex !== -1) {
            return back()->withErrors(['stage' => 'Cannot go back to a previous stage.']);
        }

        $order->production_stage = $newStage;
        $order->save();

        return redirect()->back()->with('success', 'Production stage updated.');
    }




        /**
     * COMPLETE PRODUCTION
     * Only allowed while status = processing AND current stage = varnishing
     * (the last stage). Sets production_stage = 'completed'.
     */
    public function completeProduction(Order $order)
    {
        if ($order->status !== 'processing') {
            return back()->withErrors(['error' => 'Order must be in Processing to complete production.']);
        }

        if ($order->production_stage === 'varnishing') {
            $order->production_stage = 'completed';
            $order->save();
            return redirect()->back()->with('success', 'Production marked as completed.');
        }

        return back()->withErrors(['error' => 'Cannot complete production until all stages are done.']);
    }

    /* ═══════════════════════════════════════════════════════════
     * LABOR MANAGEMENT — order items
     * ═══════════════════════════════════════════════════════════ */



        /**
     * ASSIGN WORKER
     * Sets (or clears) the employee on an order item.
     * On assign: records who assigned it and when, marks labor_status "assigned"
     * (or keeps "completed" if already finished).
     * On unassign: resets labor_status to "pending".
     */
    public function assignWorker(Request $request, OrderItem $orderItem)
    {
        $validated = $request->validate([
            'assigned_employee_id' => 'nullable|exists:employees,id',
        ]);

        $employeeId = $validated['assigned_employee_id'] ?? null;

        $orderItem->assigned_employee_id = $employeeId;
        $orderItem->assigned_by          = $employeeId ? Auth::id() : null;
        $orderItem->assigned_at          = $employeeId ? now() : null;
        $orderItem->labor_status         = $employeeId
            ? ($orderItem->labor_status === 'completed' ? 'completed' : 'assigned')
            : 'pending';
        $orderItem->save();

        return back()->with('success', $employeeId ? 'Worker assigned.' : 'Worker unassigned.');
    }



        /**
     * UPDATE LABOR COST
     * Validates and saves the labor_cost on the order item.
     */
    public function updateLaborCost(Request $request, OrderItem $orderItem)
    {
        $validated = $request->validate([
            'labor_cost' => 'nullable|numeric|min:0',
        ]);

        $orderItem->labor_cost = $validated['labor_cost'];
        $orderItem->save();

        return back()->with('success', 'Labor cost updated.');
    }

    public function completeLabor(OrderItem $orderItem)
    {
        if (!$orderItem->assigned_employee_id) {
            return back()->withErrors(['error' => 'Cannot complete — no worker assigned.']);
        }

        $orderItem->labor_status       = 'completed';
        $orderItem->labor_completed_at = now();
        $orderItem->save();

        return back()->with('success', 'Production marked complete.');
    }
}
