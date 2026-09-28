<?php

namespace App\Listeners\Payment;

use App\Events\Payment\PaymentReceived;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotifyManagerPaymentReceived
{
    public function handle(PaymentReceived $event): void
    {
        $payment = $event->payment;
        $order = $payment->order;
        $customer = $order?->user;

        if (!$order) {
            Log::warning('[PAYMENT NOTIFICATION] Order missing for payment', [
                'payment_id' => $payment->id,
            ]);
            return;
        }

        // Find all managers
        $managers = User::whereHas('role', function ($q) {
            $q->where('slug', 'manager');
        })->get();

        if ($managers->isEmpty()) {
            Log::warning('[PAYMENT NOTIFICATION] No managers found to notify');
            return;
        }

        // ✅ Use the ORDER's payment status, not the individual payment's status
        $orderPaymentStatus = $order->payment_status; // 'paid' or 'partially_paid'

        // Compute remaining balance for partial payments
        $totalPaid = $order->payments()->where('status', 'paid')->sum('amount');
        $remainingBalance = max(0, (float) $order->total - (float) $totalPaid);

        // Friendly labels
        $method = strtoupper(str_replace('_', ' ', $payment->method));
        $amount = '₱' . number_format((float) $payment->amount, 2);
        $paymentType = $payment->type === 'down_payment' ? 'Downpayment' : 'Full Payment';

        // ✅ Status label based on ORDER payment_status
        if ($orderPaymentStatus === 'paid') {
            $statusLabel = 'Fully Paid';
        } elseif ($orderPaymentStatus === 'partially_paid') {
            $statusLabel = 'Partially Paid';
        } else {
            $statusLabel = ucfirst($orderPaymentStatus);
        }

        $title = "Payment Received – {$method}";

        // ✅ Build message with remaining balance for partial payments
        $message = "{$customer?->name} paid {$amount} ({$paymentType}) for Order #{$order->order_number}.";

        if ($orderPaymentStatus === 'partially_paid' && $remainingBalance > 0) {
            $message .= " Status: {$statusLabel}. Remaining Balance: ₱" . number_format($remainingBalance, 2) . ".";
        } else {
            $message .= " Status: {$statusLabel}.";
        }

        foreach ($managers as $manager) {
            Notification::create([
                'user_id' => $manager->id,
                'type' => 'payment',
                'title' => $title,
                'message' => $message,
                'data' => [
                    'payment_id' => $payment->id,
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'amount' => (float) $payment->amount,
                    'method' => $payment->method,
                    'status' => $orderPaymentStatus, // ✅ order-level status
                    'payment_type' => $payment->type,
                    'remaining_balance' => (float) $remainingBalance,
                    'reference_number' => $order->order_number,
                    'route' => route('manager.payments.index'),
                ],
                'is_read' => false,
            ]);
        }

        Log::info('[PAYMENT NOTIFICATION] Manager notification(s) created', [
            'payment_id' => $payment->id,
            'order_payment_status' => $orderPaymentStatus,
            'remaining_balance' => $remainingBalance,
            'managers_notified' => $managers->count(),
        ]);
    }
}
