<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with(['user', 'items.product', 'payments'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                // Format total as float (already casted)
                return $order;
            });

        return Inertia::render('Admin/Orders/Index', ['orders' => $orders]);
    }

    public function show(Order $order)
    {
        $order->load(['user', 'items.product', 'payments', 'delivery']);

        return Inertia::render('Admin/Orders/Show', ['order' => $order]);
    }

  public function updateStatus(Request $request, Order $order)
{
    $request->validate([
        'status' => 'required|in:pending,accepted,processing,shipped,delivered,cancelled',
    ]);

    $newStatus = $request->status;

    // If moving to shipped, ensure production is complete (if order was processing)
    if ($newStatus === 'shipped' && $order->status === 'processing') {
        if (!$order->isProductionComplete()) {
            return back()->withErrors(['status' => 'Cannot ship order until production is completed.']);
        }
    }

    // If moving to processing, set initial production stage if not set
    if ($newStatus === 'processing' && !$order->production_stage) {
        $order->production_stage = 'carpentry';
    }

    $order->status = $newStatus;
    $order->save();

    return redirect()->back()->with('success', 'Order status updated.');
}


    public function updateProductionStage(Request $request, Order $order)
{
    $request->validate([
        'stage' => 'required|in:' . implode(',', Order::getProductionStages()),
    ]);

    // Only allow if order status is 'processing'
    if ($order->status !== 'processing') {
        return back()->withErrors(['stage' => 'Production stages can only be updated when order is in Processing.']);
    }

    $newStage = $request->stage;
    $stages = Order::getProductionStages();
    $currentIndex = $order->getCurrentStageIndex();

    // Ensure we are moving forward (can't go back)
    $newIndex = array_search($newStage, $stages);
    if ($newIndex === false) {
        return back()->withErrors(['stage' => 'Invalid stage.']);
    }

    // If already completed, cannot change
    if ($order->production_stage === 'completed') {
        return back()->withErrors(['stage' => 'Production is already completed.']);
    }

    // If new stage is not after current (or same), block
    if ($newIndex <= $currentIndex && $currentIndex !== -1) {
        return back()->withErrors(['stage' => 'Cannot go back to a previous stage.']);
    }

    // If moving to the last stage, we mark as 'completed' after saving? Or we save the stage.
    // We'll simply store the stage. When stage is 'varnishing' and admin advances again,
    // we set to 'completed'.
    if ($newStage === 'varnishing' && $currentIndex === count($stages) - 2) {
        // This is the last real stage, mark as completed after this?
        // We'll let admin explicitly set to 'completed' via a separate action or automatically.
        // Better: when admin moves to 'varnishing', we save it. Then to complete, we need another step.
        // But we can auto-complete when moving past varnishing. However we only have 4 stages.
        // We'll add a 'complete production' action.
        // Simpler: we'll use the 'completed' stage as a separate value. Admin will click a "Mark Production as Complete" button.
        // So we'll handle that separately.
    }

    // Save new stage
    $order->production_stage = $newStage;
    $order->save();

    // If the new stage is 'varnishing' and we want to auto-complete? No, we'll let admin mark complete.
    // We'll add a separate endpoint for marking production complete.

    return redirect()->back()->with('success', 'Production stage updated.');
}

public function completeProduction(Order $order)
{
    if ($order->status !== 'processing') {
        return back()->withErrors(['error' => 'Order must be in Processing to complete production.']);
    }

    $stages = Order::getProductionStages();
    // Check if we are at the last stage (varnishing) or have already completed
    if ($order->production_stage === 'varnishing') {
        $order->production_stage = 'completed';
        $order->save();
        return redirect()->back()->with('success', 'Production marked as completed.');
    }

    return back()->withErrors(['error' => 'Cannot complete production until all stages are done.']);
}



}
