<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        // ─── Stats ───
        $totalOrders = Order::where('user_id', $userId)->count();

        $pendingDeliveries = Order::where('user_id', $userId)
            ->whereIn('status', ['pending', 'accepted', 'processing', 'shipped'])
            ->count();

        $completedOrders = Order::where('user_id', $userId)
            ->where('status', 'completed')
            ->count();

        // ─── Extra financial context ───
        $totalSpent = (float) Payment::whereHas('order', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->where('status', 'paid')
            ->sum('amount');

        $outstandingBalance = 0.0;
        $partialOrders = Order::where('user_id', $userId)
            ->where('payment_status', 'partially_paid')
            ->withSum(['payments as total_paid' => function ($q) {
                $q->where('status', 'paid');
            }], 'amount')
            ->get();

        foreach ($partialOrders as $order) {
            $paid = (float) ($order->total_paid ?? 0);
            $outstandingBalance += max(0, (float) $order->total - $paid);
        }

        // ─── Recent Orders (for activity list) ───
        $recentOrders = Order::where('user_id', $userId)
            ->with(['items.product', 'payments'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $order->status,
                    'payment_status' => $order->payment_status,
                    'total' => (float) $order->total,
                    'items_count' => $order->items->count(),
                    'created_at' => $order->created_at,
                ];
            });

        return Inertia::render('Customer/Dashboard', [
            'stats' => [
                'totalOrders' => $totalOrders,
                'pendingDeliveries' => $pendingDeliveries,
                'completedOrders' => $completedOrders,
                'totalSpent' => $totalSpent,
                'outstandingBalance' => $outstandingBalance,
            ],
            'recentOrders' => $recentOrders,
        ]);
    }
}
