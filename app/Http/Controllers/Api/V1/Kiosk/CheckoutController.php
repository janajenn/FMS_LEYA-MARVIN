<?php

namespace App\Http\Controllers\Api\V1\Kiosk;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Services\OrderCreationService;
use App\Services\DeliveryFeeCalculator;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    private const KIOSK_SESSION_TTL = 3600; // 1 hour to pay

    protected OrderCreationService $orderService;
    protected DeliveryFeeCalculator $calculator;

    public function __construct(OrderCreationService $orderService, DeliveryFeeCalculator $calculator)
    {
        $this->orderService = $orderService;
        $this->calculator = $calculator;
    }

    /**
     * Kiosk Cash Checkout
     */
    public function cash(Request $request)
    {
        $validated = $request->validate([
            'customer_name'    => 'required|string|max:255',
            'customer_phone'   => 'required|string|max:20',
            'shipping_address' => 'required|string|max:1000',
            'selected_ids'     => 'nullable|string',
            'latitude'         => 'required|numeric',
            'longitude'        => 'required|numeric',
            'notes'            => 'nullable|string',
        ]);

        $kioskId = $request->kiosk_id;

        $query = Cart::with(['product', 'variant'])->where('kiosk_id', $kioskId);
        if (!empty($validated['selected_ids'])) {
            $selectedIds = array_filter(explode(',', $validated['selected_ids']));
            $query->whereIn('id', $selectedIds);
        }
        $cartItems = $query->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Cart is empty.'], 422);
        }

        $deliveryResult = $this->calculator->resolve(
            (float) $validated['latitude'],
            (float) $validated['longitude']
        );

        if (!$deliveryResult['deliverable']) {
            return response()->json(['message' => 'Out of delivery range.'], 422);
        }

        $order = $this->orderService->createFromCartItems($cartItems, [
            'source'           => 'kiosk',
            'kiosk_id'         => $kioskId,
            'user_id'          => null,
            'customer_name'    => $validated['customer_name'],
            'customer_phone'   => $validated['customer_phone'],
            'shipping_address' => $validated['shipping_address'],
            'latitude'         => $validated['latitude'],
            'longitude'        => $validated['longitude'],
            'notes'            => $validated['notes'] ?? null,
            'delivery_fee'     => $deliveryResult['fee'],
            'delivery_zone'    => $deliveryResult['tier']['label'] ?? null,
            
            // Kiosk Cash Overrides:
            'status'           => 'pending',
            'payment_status'   => 'pending',
            'payment_method'   => null,
            'payment_type'     => null,
        ]);

        return response()->json([
            'message' => 'Order placed. Please proceed to the cashier.',
            'data'    => [
                'order_id'     => $order->id,
                'order_number' => $order->order_number,
                'total'        => $order->total,
            ]
        ], 201);
    }

    /**
     * Kiosk GCash Checkout - Step 1: Generate PayMongo Session
     */
    public function gcash(Request $request)
    {
        $validated = $request->validate([
            'customer_name'    => 'required|string|max:255',
            'customer_phone'   => 'required|string|max:20',
            'shipping_address' => 'required|string|max:1000',
            'selected_ids'     => 'nullable|string',
            'latitude'         => 'required|numeric',
            'longitude'        => 'required|numeric',
            'notes'            => 'nullable|string',
        ]);

        $kioskId = $request->kiosk_id;

        $query = Cart::with(['product', 'variant'])->where('kiosk_id', $kioskId);
        if (!empty($validated['selected_ids'])) {
            $selectedIds = array_filter(explode(',', $validated['selected_ids']));
            $query->whereIn('id', $selectedIds);
        }
        $cartItems = $query->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Cart is empty.'], 422);
        }

        $deliveryResult = $this->calculator->resolve(
            (float) $validated['latitude'],
            (float) $validated['longitude']
        );

        if (!$deliveryResult['deliverable']) {
            return response()->json(['message' => 'Out of delivery range.'], 422);
        }

        $subtotal = 0.0;
        foreach ($cartItems as $c) {
            $base      = (float) ($c->variant?->price ?? $c->product->price);
            $labor     = (float) ($c->product?->labor_cost ?? 0);
            $surcharge = (float) ($c->customization_surcharge ?? 0);
            $subtotal += ($base + $labor) * $c->quantity + $surcharge;
        }
        $total = round($subtotal + (float) $deliveryResult['fee'], 2);

        $secretKey = config('services.paymongo.secret_key');
        $baseUrl = rtrim(config('app.url'), '/');
        
        $successUrl = $baseUrl . '/api/v1/payment/mobile-done?status=success'; 
        $cancelUrl  = $baseUrl . '/api/v1/payment/mobile-done?status=cancel';

        $referenceNumber  = 'KIOSK-' . date('Ymd') . '-' . strtoupper(uniqid());
        $amountInCentavos = (int) round($total * 100);

        $metadata = [
            'source'           => 'kiosk',
            'kiosk_id'         => $kioskId,
            'customer_name'    => $validated['customer_name'],
            'customer_phone'   => $validated['customer_phone'],
            'shipping_address' => $validated['shipping_address'],
            'latitude'         => (float) $validated['latitude'],
            'longitude'        => (float) $validated['longitude'],
            'notes'            => $validated['notes'] ?? '',
            'delivery_fee'     => (float) $deliveryResult['fee'],
            'delivery_zone'    => $deliveryResult['tier']['label'] ?? null,
            'total_amount'     => $total,
        ];

        try {
            $client = new Client([
                'base_uri' => 'https://api.paymongo.com/v2/',
                'auth'     => [$secretKey, ''],
                'verify'   => false,
                'timeout'  => 30,
            ]);

            $payload = [
                'data' => [
                    'attributes' => [
                        'line_items' => [[
                            'name'     => 'Kiosk Order ' . $referenceNumber,
                            'amount'   => $amountInCentavos,
                            'currency' => 'PHP',
                            'quantity' => 1,
                        ]],
                        'payment_method_types' => ['gcash'],
                        'success_url'          => $successUrl,
                        'cancel_url'           => $cancelUrl,
                        'reference_number'     => $referenceNumber,
                        'metadata'             => $metadata,
                        'send_email_receipt'   => false,
                    ],
                ],
            ];

            $response     = $client->post('checkout_sessions', ['json' => $payload]);
            $responseData = json_decode($response->getBody(), true);

            $checkoutUrl = $responseData['data']['attributes']['checkout_url'] ?? null;
            $sessionId   = $responseData['data']['id'] ?? null;

            if (!$checkoutUrl || !$sessionId) {
                throw new \RuntimeException('PayMongo did not return a checkout URL.');
            }

            Cache::put(
                'paymongo_kiosk:' . $sessionId,
                [
                    'metadata'   => $metadata,
                    'cart_ids'   => $cartItems->pluck('id')->toArray(),
                    'created_at' => now()->toIso8601String(),
                ],
                self::KIOSK_SESSION_TTL
            );

            return response()->json([
                'data' => [
                    'checkout_url'     => $checkoutUrl,
                    'session_id'       => $sessionId,
                    'reference_number' => $referenceNumber,
                    'total'            => $total,
                ],
            ], 201);

        } catch (\Throwable $e) {
            Log::error('[KIOSK GCASH] Session creation failed', ['kiosk_id' => $kioskId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Could not start payment.'], 500);
        }
    }

    /**
     * Kiosk GCash Checkout - Step 2: Poll Status
     */
          public function status(Request $request)
    {
        $validated = $request->validate(['session_id' => 'required|string']);
        $sessionId = $validated['session_id'];
        $kioskId = $request->kiosk_id;

        // 1. Idempotency check (has the order already been created?)
        $existingPayment = \App\Models\Payment::where('transaction_id', $sessionId)->first();
        if ($existingPayment) {
            $order = \App\Models\Order::find($existingPayment->order_id);
            return response()->json([
                'status'       => 'paid',
                'order_number' => $order->order_number,
                'total'        => (float) $order->total,
            ]);
        }

        // 2. Get Cache Data
        $cached = Cache::get('paymongo_kiosk:' . $sessionId);
        if (!$cached || $cached['metadata']['kiosk_id'] !== $kioskId) {
            return response()->json(['status' => 'failed', 'message' => 'Session expired or invalid.'], 404);
        }

        // 3. Query PayMongo
        $secretKey = config('services.paymongo.secret_key');
        $client = new Client([
            'base_uri' => 'https://api.paymongo.com/v1/',
            'auth'     => [$secretKey, ''],
            'verify'   => false,
        ]);

        try {
            $response = $client->get("checkout_sessions/{$sessionId}");
            $data = json_decode($response->getBody(), true);
        } catch (\Throwable $e) {
            Log::warning('[KIOSK GCASH] PayMongo check failed', ['session_id' => $sessionId, 'error' => $e->getMessage()]);
            return response()->json(['status' => 'pending', 'message' => 'Still confirming with PayMongo...'], 202);
        }

        $sessionStatus = $data['data']['attributes']['status'] ?? null;
        $paymentIntent = $data['data']['attributes']['payment_intent'] ?? null;
        $intentStatus  = $paymentIntent['attributes']['status'] ?? null;
        
        $isPaid = ($sessionStatus === 'completed') || ($intentStatus === 'succeeded');

        if (!$isPaid) {
            return response()->json([
                'status'  => 'pending',
                'debug'   => [
                    'session_status' => $sessionStatus,
                    'intent_status'  => $intentStatus,
                ]
            ], 202);
        }

        // 4. Payment is successful! Create the order.
        $cartItems = Cart::with(['product', 'variant'])
            ->whereIn('id', $cached['cart_ids'])
            ->where('kiosk_id', $kioskId)
            ->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['status' => 'failed', 'message' => 'Cart items no longer available.'], 422);
        }

        $meta = $cached['metadata'];

        // Let this throw a 500 if it fails, so we don't spin forever
        $order = $this->orderService->createFromCartItems($cartItems, [
            'source'           => 'kiosk',
            'kiosk_id'         => $kioskId,
            'user_id'          => null,
            'customer_name'    => $meta['customer_name'],
            'customer_phone'   => $meta['customer_phone'],
            'shipping_address' => $meta['shipping_address'],
            'latitude'         => $meta['latitude'],
            'longitude'        => $meta['longitude'],
            'notes'            => $meta['notes'],
            'delivery_fee'     => (float) $meta['delivery_fee'],
            'delivery_zone'    => $meta['delivery_zone'],
            
            'status'           => 'accepted',
            'payment_status'   => 'paid',
            'payment_method'   => 'paymongo',
            'payment_type'     => 'full_payment',
            'amount_to_pay'    => (float) $meta['total_amount'],
            'transaction_id'   => $sessionId,
        ]);

        Cache::forget('paymongo_kiosk:' . $sessionId);

        return response()->json([
            'status'       => 'paid',
            'order_number' => $order->order_number,
            'total'        => (float) $order->total,
        ]);
    }
}