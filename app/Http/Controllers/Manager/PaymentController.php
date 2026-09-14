<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index()
    {
        // Get all orders with payments and user
        $orders = Order::with(['user', 'payments'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                $totalPaid = $order->payments->where('status', 'paid')->sum('amount');
                $remainingBalance = max(0, $order->total - $totalPaid);

                // Determine overall payment status
                if ($order->payment_status === 'paid') {
                    $paymentStatus = 'Paid';
                    $statusColor = 'bg-green-100 text-green-800';
                } elseif ($order->payment_status === 'partially_paid') {
                    $paymentStatus = 'Partially Paid';
                    $statusColor = 'bg-blue-100 text-blue-800';
                } elseif ($totalPaid > 0 && $order->payment_status === 'pending') {
                    // This shouldn't happen, but just in case
                    $paymentStatus = 'Partially Paid';
                    $statusColor = 'bg-blue-100 text-blue-800';
                } else {
                    $paymentStatus = 'Unpaid';
                    $statusColor = 'bg-gray-100 text-gray-800';
                }

                // Get the latest payment for payment method
                $latestPayment = $order->payments->last();

                return [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->user->name ?? 'N/A',
                    'customer_email' => $order->user->email ?? 'N/A',
                    'order_total' => (float) $order->total,
                    'total_paid' => (float) $totalPaid,
                    'remaining_balance' => (float) $remainingBalance,
                    'payment_status' => $paymentStatus,
                    'status_color' => $statusColor,
                    'payment_method' => $latestPayment->method ?? 'N/A',
                    'payment_count' => $order->payments->count(),
                    'created_at' => $order->created_at,
                    'payment_type' => $latestPayment->type ?? 'N/A',
                ];
            });

        // Calculate total received from all successful payments
        $totalReceived = \App\Models\Payment::where('status', 'paid')->sum('amount');

        return Inertia::render('Manager/Payments/Index', [
            'orders' => $orders,
            'totalReceived' => (float) $totalReceived,
        ]);
    }
}
