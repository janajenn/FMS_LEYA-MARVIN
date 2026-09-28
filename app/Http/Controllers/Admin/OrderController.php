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
            'items.product',
            'items.variant',
            'items.assignedEmployee',
            'payments',
            'delivery',
        ]);

        return Inertia::render('Admin/Orders/Show', [
            'order'     => $order,
            'employees' => \App\Models\Employee::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'position']),
        ]);
    }

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
