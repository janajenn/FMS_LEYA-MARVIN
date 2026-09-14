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
        $order->load(['user', 'items.product', 'payments', 'delivery']);

        // Add finish names (same as customer show)
        foreach ($order->items as $item) {
            if (isset($item->customization_data['finish_id'])) {
                $finish = \App\Models\Material::find($item->customization_data['finish_id']);
                $item->finish_name = $finish ? $finish->name : null;
            }
        }

        return Inertia::render('Manager/Orders/Show', ['order' => $order]);
    }
}
