<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Events\Payment\PaymentReceived; // ✅ add
use App\Services\OrderMaterialService;
use App\Services\MaterialCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Handle incoming PayMongo webhooks.
     */
    public function handlePayMongo(Request $request)
    {
        // Verify signature (optional but recommended)
        // $this->verifySignature($request);

        $payload = $request->all();
        $eventType = $payload['data']['attributes']['type'] ?? null;

        Log::info('PayMongo webhook received', ['type' => $eventType, 'payload' => $payload]);

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

        // Always return 200 to acknowledge receipt
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

    Log::info('Webhook: Payment paid', ['session_id' => $sessionId, 'metadata' => $metadata]);

    if (Payment::where('transaction_id', $sessionId)->exists()) {
        Log::info('Webhook: Order already exists for session', ['session_id' => $sessionId]);
        return;
    }

    $userId          = $metadata['user_id'] ?? null;
    $selectedIds     = isset($metadata['selected_ids']) ? explode(',', $metadata['selected_ids']) : [];
    $shippingAddress = $metadata['shipping_address'] ?? '';
    $deliveryZone    = $metadata['delivery_zone'] ?? null;
    $notes           = $metadata['notes'] ?? null;
    $paymentMethod   = $metadata['payment_method'] ?? 'cash_on_delivery';
    $paymentType     = $metadata['payment_type'] ?? 'down_payment';

    if (!$userId) {
        Log::error('Webhook: Missing user_id in metadata');
        return;
    }

    // ✅ Snippet 1 — eager-load variant
    $cartItems = Cart::with(['product', 'variant'])->where('user_id', $userId);
    if (!empty($selectedIds)) {
        $cartItems = $cartItems->whereIn('id', $selectedIds);
    }
    $cartItems = $cartItems->get();

    if ($cartItems->isEmpty()) {
        Log::warning('Webhook: No cart items found', ['user_id' => $userId]);
        return;
    }

    $subtotal = $cartItems->sum(function ($item) {
        $unitPrice = (float) ($item->variant?->price ?? $item->product->price)
                   + (float) ($item->product->labor_cost ?? 0);
        return $unitPrice * $item->quantity;
    });

    $customizationSurcharge = $cartItems->sum(function ($item) {
        return (float) ($item->customization_surcharge ?? 0);
    });

    $deliveryFee   = (float) ($metadata['delivery_fee'] ?? 100);
    $total         = $subtotal + $customizationSurcharge + $deliveryFee;
    $paymentAmount = ($paymentType === 'down_payment') ? $total * 0.5 : $total;

    $materialService = new OrderMaterialService(new MaterialCalculationService());
    $payment = null;

    DB::transaction(function () use (
        $cartItems,
        $total,
        $deliveryFee,
        $paymentAmount,
        $paymentMethod,
        $paymentType,
        $metadata,          // ✅ ADDED — needed for latitude/longitude/shipping
        $userId,
        $materialService,
        $sessionId,
        &$payment
    ) {
        $order = Order::create([
            'user_id'          => $userId,                    // ✅ from metadata, not Auth::id()
            'order_number'     => Order::generateOrderNumber(),
            'total'            => $total,
            'status'           => 'accepted',
            'payment_status'   => ($paymentType === 'full_payment') ? 'paid' : 'partially_paid',
            'shipping_address' => $metadata['shipping_address'] ?? '',
            'delivery_zone'    => $metadata['delivery_zone'] ?? null,
            'delivery_fee'     => $deliveryFee,
            'notes'            => $metadata['notes'] ?? null,
            'latitude'         => $metadata['latitude'] ?? null,
            'longitude'        => $metadata['longitude'] ?? null,
        ]);

        foreach ($cartItems as $cartItem) {
            // ✅ Snippet 2 — unit price includes variant + labor
            $unitPrice = (float) ($cartItem->variant?->price ?? $cartItem->product->price)
                       + (float) ($cartItem->product->labor_cost ?? 0);

            $orderItem = OrderItem::create([
                'order_id'                => $order->id,
                'product_id'              => $cartItem->product_id,
                'variant_id'              => $cartItem->variant_id,
                'quantity'                => $cartItem->quantity,
                'price'                   => $unitPrice,
                'customization_surcharge' => (float) ($cartItem->customization_surcharge ?? 0),
                'customization_breakdown' => $cartItem->customization_breakdown,
                'customization_data'      => $cartItem->customization_data,
                'labor_cost'              => $cartItem->product->labor_cost,
                'labor_status'            => 'pending',
            ]);

            $product = $cartItem->product;

            try {
                $materialService->processOrderItemMaterials(
                    $orderItem,
                    $product,
                    $cartItem->customization_data ?? []
                );
            } catch (\Exception $e) {
                Log::error('[WEBHOOK] Material service failed for order item', [
                    'order_item_id' => $orderItem->id,
                    'error'         => $e->getMessage(),
                ]);
                throw $e;
            }
        }

        $payment = Payment::create([
            'order_id'       => $order->id,
            'amount'         => $paymentAmount,
            'method'         => 'paymongo',
            'status'         => 'paid',
            'type'           => $paymentType,
            'transaction_id' => $sessionId,
            'paid_at'        => now(),
        ]);

        $cartItemIds = $cartItems->pluck('id')->toArray();
        Cart::whereIn('id', $cartItemIds)->where('user_id', $userId)->delete();

        Log::info('Webhook: Order created successfully', [
            'order_id'   => $order->id,
            'session_id' => $sessionId,
        ]);
    });

    if ($payment) {
        PaymentReceived::dispatch($payment);
    }
}





    /**
     * Handle payment failure.
     */
    private function handlePaymentFailed($payload)
    {
        $sessionId = $payload['data']['attributes']['data']['id'] ?? null;
        $metadata = $payload['data']['attributes']['data']['attributes']['metadata'] ?? [];

        Log::warning('Webhook: Payment failed', [
            'session_id' => $sessionId,
            'metadata' => $metadata,
        ]);

        // You could notify the user or log the failure for follow-up.
    }

    /**
     * Verify webhook signature (optional).
     */
    private function verifySignature(Request $request)
    {
        $signature = $request->header('Paymongo-Signature');
        $webhookSecret = config('services.paymongo.webhook_secret');

        if (!$signature || !$webhookSecret) {
            Log::warning('Missing webhook signature or secret');
            return;
        }

        $payload = $request->getContent();
        $computedSignature = hash_hmac('sha256', $payload, $webhookSecret);

        if (!hash_equals($computedSignature, $signature)) {
            Log::warning('Invalid webhook signature');
            abort(401, 'Invalid signature');
        }
    }
}
