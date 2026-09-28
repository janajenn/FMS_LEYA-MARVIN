<?php

namespace App\Listeners\Payment;

use App\Events\Payment\RemainingBalanceCollected;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotifyManagerAndAdminRemainingBalanceCollected
{
    public function handle(RemainingBalanceCollected $event): void
    {
        $payment = $event->payment;
        $order = $payment->order;
        $customer = $order?->user;
        $driver = $payment->order?->delivery?->driver;

        if (!$order) {
            Log::warning('[REMAINING BALANCE] Order missing for payment', [
                'payment_id' => $payment->id,
            ]);
            return;
        }

        // Fetch BOTH managers and admins
        $recipients = User::whereHas('role', function ($q) {
            $q->whereIn('slug', ['manager', 'admin']);
        })->get();

        if ($recipients->isEmpty()) {
            Log::warning('[REMAINING BALANCE] No managers/admins found to notify');
            return;
        }

        $amount = '₱' . number_format((float) $payment->amount, 2);
        $method = strtoupper(str_replace('_', ' ', $payment->method));
        $collectedAt = $payment->paid_at
            ? $payment->paid_at->format('M d, Y g:i A')
            : now()->format('M d, Y g:i A');

        $title = "Remaining Balance Collected – {$method}";

        $message = sprintf(
            '%s collected %s from %s for Order #%s. Payment Method: %s. Collected at: %s.',
            $driver?->name ?? 'Delivery Rider',
            $amount,
            $customer?->name ?? 'Customer',
            $order->order_number,
            $method,
            $collectedAt
        );

        foreach ($recipients as $recipient) {
            Notification::create([
                'user_id' => $recipient->id,
                'type' => 'remaining_balance_payment',
                'title' => $title,
                'message' => $message,
                'data' => [
                    'payment_id' => $payment->id,
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $customer?->name,
                    'driver_name' => $driver?->name,
                    'amount' => (float) $payment->amount,
                    'method' => $payment->method,
                    'status' => 'paid',
                    'payment_type' => 'remaining_balance',
                    'collected_at' => $payment->paid_at?->toIso8601String(),
                    'reference_number' => $order->order_number,
                    'route' => $recipient->role->slug === 'admin'
                        ? route('admin.orders.show', $order->id)
                        : route('manager.payments.index'),
                ],
                'is_read' => false,
            ]);
        }

        Log::info('[REMAINING BALANCE] Notifications created', [
            'payment_id' => $payment->id,
            'order_id' => $order->id,
            'recipients' => $recipients->count(),
        ]);
    }
}
