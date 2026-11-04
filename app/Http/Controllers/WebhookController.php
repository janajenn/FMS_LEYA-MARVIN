<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Payment;
use App\Services\OrderCreationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    protected OrderCreationService $orderService;

    public function __construct(OrderCreationService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * Handle incoming PayMongo webhooks.
     */
    public function handlePayMongo(Request $request)
    {
        // $this->verifySignature($request);

        $payload = $request->all();
        $eventType = $payload['data']['attributes']['type'] ?? null;

        Log::info('PayMongo webhook received', ['type' => $eventType]);

        switch ($eventType) {
            case 'checkout_session.payment.paid':
            case 'payment.paid':
                $this->handlePaymentPaid($payload);
                break;

            case 'payment.failed':
                $this->handlePaymentFailed($payload);
                break;

            default:
                Log::info('Unhandled webhook event', ['type' => $eventType]);
        }

        return response()->json(['status' => 'success'], 200);
    }

    /**
     * Handle successful payment.
     */
    private function handlePaymentPaid($payload)
    {
        $sessionId = $payload['data']['attributes']['data']['id'] ?? null;
        $metadata  = $payload['data']['attributes']['data']['attributes']['metadata'] ?? [];

        if (!$sessionId) {
            Log::warning('Webhook: Missing session ID');
            return;
        }

        Log::info('Webhook: Payment paid', ['session_id' => $sessionId]);

        // Idempotency check
        if (Payment::where('transaction_id', $sessionId)->exists()) {
            Log::info('Webhook: Order already exists for session', ['session_id' => $sessionId]);
            return;
        }

        $source = $metadata['source'] ?? 'web';

        // ────────────────────────────────────────────────────────
        // KIOSK PAYMENT
        // ────────────────────────────────────────────────────────
        if ($source === 'kiosk') {
            $kioskId = $metadata['kiosk_id'] ?? null;
            $cached = Cache::get('paymongo_kiosk:' . $sessionId);
            
            if (!$cached) {
                Log::warning('Webhook: Kiosk session cache expired or missing', ['session_id' => $sessionId]);
                return;
            }

            $cartItems = Cart::with(['product', 'variant'])
                ->whereIn('id', $cached['cart_ids'])
                ->where('kiosk_id', $kioskId)
                ->get();

            if ($cartItems->isEmpty()) {
                Log::warning('Webhook: Kiosk cart items not found', ['session_id' => $sessionId]);
                return;
            }

            $this->orderService->createFromCartItems($cartItems, [
                'source'           => 'kiosk',
                'kiosk_id'         => $kioskId,
                'user_id'          => null,
                'customer_name'    => $metadata['customer_name'] ?? 'Walk-in',
                'customer_phone'   => $metadata['customer_phone'] ?? '',
                'shipping_address' => $metadata['shipping_address'] ?? '',
                'latitude'         => $metadata['latitude'] ?? null,
                'longitude'        => $metadata['longitude'] ?? null,
                'notes'            => $metadata['notes'] ?? null,
                'delivery_fee'     => (float) ($metadata['delivery_fee'] ?? 0),
                'delivery_zone'    => $metadata['delivery_zone'] ?? null,
                
                'status'           => 'accepted',
                'payment_status'   => 'paid',
                'payment_method'   => 'paymongo',
                'payment_type'     => 'full_payment',
                'amount_to_pay'    => (float) ($metadata['total_amount'] ?? 0),
                'transaction_id'   => $sessionId,
            ]);

            Cache::forget('paymongo_kiosk:' . $sessionId);
            Log::info('Webhook: Kiosk order created successfully', ['session_id' => $sessionId]);
            return;
        }

        // ────────────────────────────────────────────────────────
        // WEB / MOBILE PAYMENT
        // ────────────────────────────────────────────────────────
        $userId = $metadata['user_id'] ?? null;
        if (!$userId) {
            Log::error('Webhook: Missing user_id in metadata for web payment');
            return;
        }

        $selectedIds = isset($metadata['selected_ids']) ? explode(',', $metadata['selected_ids']) : [];

        $cartQuery = Cart::with(['product', 'variant'])->where('user_id', $userId);
        if (!empty($selectedIds)) {
            $cartQuery->whereIn('id', $selectedIds);
        }
        $cartItems = $cartQuery->get();

        if ($cartItems->isEmpty()) {
            Log::warning('Webhook: No cart items found', ['user_id' => $userId]);
            return;
        }

        $paymentType = $metadata['payment_type'] ?? 'down_payment';
        
        // Calculate total for amount_to_pay
        $subtotal = 0.0;
        foreach ($cartItems as $c) {
            $base      = (float) ($c->variant?->price ?? $c->product->price);
            $labor     = (float) ($c->product?->labor_cost ?? 0);
            $surcharge = (float) ($c->customization_surcharge ?? 0);
            $subtotal += ($base + $labor) * $c->quantity + $surcharge;
        }
        $deliveryFee = (float) ($metadata['delivery_fee'] ?? 0);
        $total = round($subtotal + $deliveryFee, 2);
        $paymentAmount = ($paymentType === 'down_payment') ? $total * 0.5 : $total;

        $this->orderService->createFromCartItems($cartItems, [
            'source'           => 'web',
            'user_id'          => $userId,
            'shipping_address' => $metadata['shipping_address'] ?? '',
            'latitude'         => $metadata['latitude'] ?? null,
            'longitude'        => $metadata['longitude'] ?? null,
            'notes'            => $metadata['notes'] ?? null,
            'delivery_fee'     => $deliveryFee,
            'delivery_zone'    => $metadata['delivery_zone'] ?? null,
            
            'status'           => 'accepted',
            'payment_status'   => ($paymentType === 'full_payment') ? 'paid' : 'partially_paid',
            'payment_method'   => 'paymongo',
            'payment_type'     => $paymentType,
            'amount_to_pay'    => $paymentAmount,
            'transaction_id'   => $sessionId,
        ]);

        Log::info('Webhook: Web order created successfully', ['session_id' => $sessionId]);
    }

    private function handlePaymentFailed($payload)
    {
        $sessionId = $payload['data']['attributes']['data']['id'] ?? null;
        Log::warning('Webhook: Payment failed', ['session_id' => $sessionId]);
    }
}