<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * Display a listing of all orders (read-only).
     */
    public function index()
    {
        $orders = Order::with(['user', 'payments'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                $totalPaid = $order->payments->where('status', 'paid')->sum('amount');
                $remainingBalance = max(0, $order->total - $totalPaid);

                // Get production stage display
                $productionStage = $order->production_stage;
                $productionLabel = $productionStage ? Order::getStageLabel($productionStage) : null;
                $productionCompleted = $productionStage === 'completed';

                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->user->name ?? 'N/A',
                    'total' => (float) $order->total,
                    'total_paid' => (float) $totalPaid,
                    'remaining_balance' => (float) $remainingBalance,
                    'status' => $order->status,
                    'payment_status' => $order->payment_status,
                    'production_stage' => $productionStage,
                    'production_label' => $productionLabel,
                    'production_completed' => $productionCompleted,
                    'created_at' => $order->created_at,
                ];
            });

        return Inertia::render('Manager/Orders/Index', ['orders' => $orders]);
    }

    /**
     * Display the specified order details (read-only).
     */
   public function show(Order $order)
{
    $order->load([
        'user',
        'items.product.images',
        'items.product.parts.designs',
        'items.product.finishMaterial',
        'items.product.assignedEmployee',
        'items.variant.images',
        'items.assignedEmployee',
        'payments',
        'delivery.tier',
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

        // ── Labor breakdown ──
        $breakdown = $item->customization_breakdown ?? [];
        $item->base_labor_cost   = (float) ($item->product?->labor_cost ?? 0);
        $item->design_labor_cost = (float) ($breakdown['design_labor_surcharge'] ?? 0);
        $item->total_labor_cost  = (float) ($item->labor_cost
            ?? ($item->base_labor_cost + $item->design_labor_cost));

        // ── Assigned employee ──
        $item->resolved_employee = $item->assignedEmployee
            ?? $item->product?->assignedEmployee
            ?? null;

        // ── Price summary ──
        $item->finish_surcharge       = (float) ($breakdown['finish_surcharge']       ?? $item->finish_surcharge ?? 0);
        $item->design_surcharge       = (float) ($breakdown['design_surcharge']       ?? 0);
        $item->material_cost_diff     = (float) ($breakdown['material_cost_diff']     ?? 0);
        $item->material_cost_standard = (float) ($breakdown['material_cost_standard'] ?? 0);
        $item->material_cost_custom   = (float) ($breakdown['material_cost_custom']   ?? 0);
        $item->markup_percent         = (float) ($breakdown['markup_percent']         ?? 0);

        $item->unit_price_with_labor         = (float) $item->price;
        $item->customization_surcharge_total = (float) ($item->customization_surcharge ?? 0);
        $item->line_total = $item->unit_price_with_labor * $item->quantity
                          + $item->customization_surcharge_total;

        // ── Normalize customization_data ──
        $customData = $item->customization_data ?? [];
        $partsData = !empty($customData['parts']) && is_array($customData['parts'])
            ? $customData['parts']
            : [];
        if (empty($partsData)) {
            foreach ($customData as $k => $v) {
                if (is_numeric($k) && is_array($v)) $partsData[$k] = $v;
            }
        }

        // ── Parts list ──
        $partsList = [];
        if ($item->product) {
            foreach ($item->product->parts as $part) {
                $pData = $partsData[$part->id] ?? null;

                $designId = $pData['design_id'] ?? null;
                $design = null;
                if ($designId) {
                    $design = $part->designs->firstWhere('id', $designId);
                }
                if (!$design && $part->designs->count() > 0) {
                    $design = $part->designs->firstWhere('is_default', true)
                        ?? $part->designs->first();
                }

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
                    'design_labor_cost' => $designIsNonDefault ? (float) ($design->additional_labor_cost ?? 0) : 0.0,
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
        $item->has_any_customization   = $item->customized_parts_count > 0
            || $item->finish_option_resolved === 'standard';
    }

    return Inertia::render('Manager/Orders/Show', ['order' => $order]);
}


}
