<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\DeliveryZone;
use App\Models\Order;
use App\Models\Payment;
use App\Services\DeliveryFeeCalculator;
use App\Services\OrderCreationService; // 👈 NEW
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    /** Cache TTL for pending PayMongo sessions (2 hours). */
    private const SESSION_TTL_SECONDS = 7200;

    protected OrderCreationService $orderService; // 👈 NEW

    public function __construct(OrderCreationService $orderService) // 👈 NEW
    {
        $this->orderService = $orderService;
    }

    /* ═══════════════════════════════════════════════════════
     *  Delivery zones
     * ═══════════════════════════════════════════════════════ */

    public function zones()
    {
        $zones = DeliveryZone::where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'description',
                'fee_type',
                'fee',
                'estimated_days',
                'latitude',
                'longitude',
                'radius',
            ]);

        return response()->json(['data' => $zones]);
    }

    public function zoneByCoordinates(Request $request)
    {
        $data = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
        ]);

        $zones = DeliveryZone::where('is_active', true)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereNotNull('radius')
            ->get();

        $matched = null;
        $matchedDistance = null;

        foreach ($zones as $zone) {
            $distance = $this->haversineDistance(
                (float) $data['lat'],
                (float) $data['lng'],
                (float) $zone->latitude,
                (float) $zone->longitude
            );
            if ($distance <= (float) $zone->radius) {
                $matched = $zone;
                $matchedDistance = $distance;
                break;
            }
        }

        return response()->json([
            'zone'     => $matched,
            'distance' => $matchedDistance,
        ]);
    }

    private function haversineDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2
           + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }

    /* ═══════════════════════════════════════════════════════
     *  Cash on Delivery (Refactored to use Service)
     * ═══════════════════════════════════════════════════════ */

    public function store(Request $request, DeliveryFeeCalculator $calculator)
    {
        $validated = $request->validate([
            'shipping_address' => 'required|string|max:1000',
            'notes'            => 'nullable|string|max:1000',
            'payment_method'   => 'required|in:cash_on_delivery',
            'selected_ids'     => 'nullable|string',
            'latitude'         => 'required|numeric|between:-90,90',
            'longitude'        => 'required|numeric|between:-180,180',
        ]);

        $user = $request->user();

        $selectedIds = array_filter(
            array_map('intval', explode(',', (string) ($validated['selected_ids'] ?? '')))
        );

        $query = Cart::with(['product', 'variant'])->where('user_id', $user->id);
        if (!empty($selectedIds)) {
            $query->whereIn('id', $selectedIds);
        }
        $cartItems = $query->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'No items selected for checkout.'], 422);
        }

        $deliveryResult = $calculator->resolve(
            (float) $validated['latitude'],
            (float) $validated['longitude']
        );

        if (!$deliveryResult['deliverable']) {
            return response()->json([
                'message' => "We cannot deliver to this location. It is {$deliveryResult['distance_km']} km from our store, which is outside our delivery range.",
            ], 422);
        }

        try {
            // 👇 USE THE NEW SERVICE 👇
            $order = $this->orderService->createFromCartItems($cartItems, [
                'source'           => 'web', 
                'user_id'          => $user->id,
                'shipping_address' => $validated['shipping_address'],
                'notes'            => $validated['notes'] ?? null,
                'latitude'         => (float) $validated['latitude'],
                'longitude'        => (float) $validated['longitude'],
                'delivery_fee'     => (float) $deliveryResult['fee'],
                'delivery_zone'    => $deliveryResult['tier']['label'] ?? null,
                
                // COD specifics
                'status'           => 'pending',
                'payment_status'   => 'unpaid',
                'payment_type'     => null, 
            ]);

            Log::info('[COD STORE] Order placed', [
                'order_id'      => $order->id,
                'order_number'  => $order->order_number,
                'user_id'       => $user->id,
                'distance_km'   => $deliveryResult['distance_km'],
                'delivery_fee'  => $deliveryResult['fee'],
                'total'         => (float) $order->total,
            ]);

            return response()->json([
                'message' => 'Order placed successfully.',
                'data'    => [
                    'order_id'         => $order->id,
                    'order_number'     => $order->order_number,
                    'total'            => (float) $order->total,
                    'status'           => $order->status,
                    'payment_status'   => $order->payment_status,
                    'shipping_address' => $order->shipping_address,
                    'delivery_zone'    => $order->delivery_zone,
                    'delivery_fee'     => (float) $order->delivery_fee,
                    'distance_km'      => $deliveryResult['distance_km'],
                    'estimated_days'   => (int) ($deliveryResult['estimated_days'] ?? config('store.estimated_days', 3)),
                    'notes'            => $order->notes,
                    'created_at'       => $order->created_at->toIso8601String(),
                ],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('API COD checkout failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Could not place your order. Please try again.'], 500);
        }
    }


    /* ═══════════════════════════════════════════════════════
     *  PayMongo — Step 1: Create checkout session (Unchanged)
     * ═══════════════════════════════════════════════════════ */

    public function paymongo(Request $request, DeliveryFeeCalculator $calculator)
    {
        $validated = $request->validate([
            'shipping_address' => 'required|string|max:1000',
            'notes'            => 'nullable|string|max:1000',
            'selected_ids'     => 'nullable|string',
            'payment_method'   => 'required|in:cash_on_delivery,gcash',
            'latitude'         => 'required|numeric|between:-90,90',
            'longitude'        => 'required|numeric|between:-180,180',
        ]);

        $user = $request->user();

        $selectedIds = array_filter(
            array_map('intval', explode(',', (string) ($validated['selected_ids'] ?? '')))
        );

        $query = Cart::with(['product', 'variant'])->where('user_id', $user->id);
        if (!empty($selectedIds)) {
            $query->whereIn('id', $selectedIds);
        }
        $cartItems = $query->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'No items selected for checkout.'], 422);
        }

        $deliveryResult = $calculator->resolve(
            (float) $validated['latitude'],
            (float) $validated['longitude']
        );

        if (!$deliveryResult['deliverable']) {
            return response()->json([
                'message' => "We cannot deliver to this location. It is {$deliveryResult['distance_km']} km from our store, which is outside our delivery range.",
            ], 422);
        }

        $deliveryFee   = (float) $deliveryResult['fee'];
        $deliveryLabel = $deliveryResult['tier']['label'] ?? null;
        $estimatedDays = (int) ($deliveryResult['estimated_days'] ?? config('store.estimated_days', 3));

        $subtotal = 0.0;
        foreach ($cartItems as $c) {
            $base      = (float) ($c->variant?->price ?? $c->product->price);
            $labor     = (float) ($c->product?->labor_cost ?? 0);
            $surcharge = (float) ($c->customization_surcharge ?? 0);
            $subtotal += ($base + $labor) * $c->quantity + $surcharge;
        }
        $total = round($subtotal + $deliveryFee, 2);

        if ($total <= 0) {
            return response()->json(['message' => 'Invalid order total.'], 422);
        }

        $isCOD       = $validated['payment_method'] === 'cash_on_delivery';
        $paymentType = $isCOD ? 'down_payment' : 'full_payment';
        $amountToPay = $isCOD ? round($total * 0.5, 2) : $total;

        $secretKey = config('services.paymongo.secret_key');
        if (empty($secretKey)) {
            return response()->json(['message' => 'Payment gateway not configured.'], 500);
        }

        $baseUrl    = rtrim(config('app.url'), '/');
        $successUrl = $baseUrl . '/api/v1/payment/mobile-done?status=success';
        $cancelUrl  = $baseUrl . '/api/v1/payment/mobile-done?status=cancel';

        $referenceNumber  = 'MOB-' . date('Ymd') . '-' . strtoupper(uniqid());
        $amountInCentavos = (int) round($amountToPay * 100);

        $metadata = [
            'user_id'          => $user->id,
            'selected_ids'     => $cartItems->pluck('id')->implode(','),
            'delivery_zone'    => $deliveryLabel,
            'delivery_fee'     => $deliveryFee,
            'distance_km'      => $deliveryResult['distance_km'],
            'estimated_days'   => $estimatedDays,
            'shipping_address' => $validated['shipping_address'],
            'notes'            => $validated['notes'] ?? '',
            'payment_method'   => $validated['payment_method'],
            'payment_type'     => $paymentType,
            'total_amount'     => $total,
            'amount_to_pay'    => $amountToPay,
            'latitude'         => (float) $validated['latitude'],
            'longitude'        => (float) $validated['longitude'],
        ];

        $paymentMethodTypes = $isCOD ? ['card', 'gcash', 'paymaya'] : ['gcash'];

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
                            'name'     => ($isCOD ? 'Down Payment — ' : 'Order ') . $referenceNumber,
                            'amount'   => $amountInCentavos,
                            'currency' => 'PHP',
                            'quantity' => 1,
                        ]],
                        'payment_method_types' => $paymentMethodTypes,
                        'success_url'          => $successUrl,
                        'cancel_url'           => $cancelUrl,
                        'reference_number'     => $referenceNumber,
                        'metadata'             => $metadata,
                        'send_email_receipt'   => true,
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
                'paymongo_mobile:' . $sessionId,
                [
                    'user_id'       => $user->id,
                    'metadata'      => $metadata,
                    'total'         => $total,
                    'amount_to_pay' => $amountToPay,
                    'reference'     => $referenceNumber,
                    'created_at'    => now()->toIso8601String(),
                ],
                self::SESSION_TTL_SECONDS
            );

            return response()->json([
                'data' => [
                    'checkout_url'     => $checkoutUrl,
                    'session_id'       => $sessionId,
                    'reference_number' => $referenceNumber,
                    'total'            => $total,
                    'amount_to_pay'    => $amountToPay,
                    'payment_type'     => $paymentType,
                ],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('[MOBILE CHECKOUT] PayMongo session creation failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Could not start payment. ' . $e->getMessage(),
            ], 500);
        }
    }


    /* ═══════════════════════════════════════════════════════
     *  PayMongo — Step 2: Verify payment + create order (Refactored)
     * ═══════════════════════════════════════════════════════ */

    public function verify(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $sessionId = $validated['session_id'];

        Log::info('[VERIFY] Called', [
            'session_id' => $sessionId,
            'user_id'    => $user->id,
        ]);

        // ── 1. Already processed? ──
        $existing = Payment::where('transaction_id', $sessionId)->first();
        if ($existing) {
            $order = Order::with(['items'])->find($existing->order_id);
            return response()->json([
                'status' => 'paid',
                'order'  => $this->serializeOrder($order),
                'source' => 'db',
            ]);
        }

        // ── 2. Cached metadata ──
        $cached = Cache::get('paymongo_mobile:' . $sessionId);
        if (!$cached || $cached['user_id'] !== $user->id) {
            return response()->json([
                'status'  => 'failed',
                'message' => 'Payment session not found or expired.',
            ], 404);
        }

        $metadata = $cached['metadata'];
        $secretKey = config('services.paymongo.secret_key');

        // ── 3. Query PayMongo (v1 for Retrieve) ──
        $client = new Client([
            'base_uri' => 'https://api.paymongo.com/v1/',
            'auth'     => [$secretKey, ''],
            'verify'   => false,
            'timeout'  => 20,
        ]);

        try {
            $response = $client->get("checkout_sessions/{$sessionId}");
            $data = json_decode($response->getBody(), true);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'pending',
                'message' => 'Still confirming with payment provider.',
            ], 202);
        }

        $sessionStatus = $data['data']['attributes']['status'] ?? null;
        $payments      = $data['data']['attributes']['payments'] ?? [];
        
        $hasPaid = false;
        foreach ($payments as $p) {
            if (in_array($p['attributes']['status'] ?? null, ['paid', 'authorized'], true)) {
                $hasPaid = true;
                break;
            }
        }

        if ($sessionStatus !== 'completed' && !$hasPaid) {
            return response()->json([
                'status' => 'pending',
                'debug'  => ['session_status' => $sessionStatus],
            ], 202);
        }

        // ── 4. Create Order using Service ──
        $selectedIds = array_filter(explode(',', $metadata['selected_ids'] ?? ''));
        $cartQuery = Cart::with(['product', 'variant'])->where('user_id', $user->id);
        if (!empty($selectedIds)) {
            $cartQuery->whereIn('id', $selectedIds);
        }
        $cartItems = $cartQuery->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['status' => 'failed', 'message' => 'Cart items no longer available.'], 422);
        }

        try {
            $order = $this->orderService->createFromCartItems($cartItems, [
                'source'           => 'web',
                'user_id'          => $user->id,
                'shipping_address' => $metadata['shipping_address'] ?? '',
                'notes'            => $metadata['notes'] ?? null,
                'latitude'         => $metadata['latitude'] ?? null,
                'longitude'        => $metadata['longitude'] ?? null,
                'delivery_fee'     => (float) ($metadata['delivery_fee'] ?? 0),
                'delivery_zone'    => $metadata['delivery_zone'] ?? null,
                
                // PayMongo specifics
                'status'           => 'accepted',
                'payment_status'   => $metadata['payment_type'] === 'full_payment' ? 'paid' : 'partially_paid',
                'payment_method'   => 'paymongo',
                'payment_type'     => $metadata['payment_type'],
                'amount_to_pay'    => (float) ($cached['amount_to_pay'] ?? $cached['total']),
                'transaction_id'   => $sessionId,
            ]);

            Cache::forget('paymongo_mobile:' . $sessionId);

            return response()->json([
                'status' => 'paid',
                'order'  => $this->serializeOrder($order),
                'source' => 'live',
            ]);
        } catch (\Throwable $e) {
            Log::error('[MOBILE VERIFY] Order creation failed', ['session_id' => $sessionId, 'error' => $e->getMessage()]);
            return response()->json(['status' => 'failed', 'message' => 'Payment confirmed but order could not be created.'], 500);
        }
    }

    private function serializeOrder(?Order $order): ?array
    {
        if (!$order) return null;
        return [
            'order_id'         => $order->id,
            'order_number'     => $order->order_number,
            'total'            => (float) $order->total,
            'status'           => $order->status,
            'payment_status'   => $order->payment_status,
            'shipping_address' => $order->shipping_address,
            'delivery_zone'    => $order->delivery_zone,
            'delivery_fee'     => (float) $order->delivery_fee,
            'notes'            => $order->notes,
            'created_at'       => optional($order->created_at)->toIso8601String(),
        ];
    }

    /* ═══════════════════════════════════════════════════════
     *  Utilities
     * ═══════════════════════════════════════════════════════ */

    public function reverseGeocode(Request $request)
    {
        $data = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
        ]);

        $fallback = sprintf(
            'Pinned location (%.5f, %.5f)',
            $data['lat'],
            $data['lng']
        );

        try {
            $client = new Client([
                'timeout' => 8,
                'verify'  => false,
            ]);

            $res = $client->get('https://nominatim.openstreetmap.org/reverse', [
                'query' => [
                    'format'         => 'jsonv2',
                    'lat'            => $data['lat'],
                    'lon'            => $data['lng'],
                    'zoom'           => 18,
                    'addressdetails' => 1,
                ],
                'headers' => [
                    'User-Agent' => 'FMS-Mobile/1.0 (admin@fms.local)',
                    'Accept'     => 'application/json',
                ],
            ]);

            $body = json_decode($res->getBody(), true);
            $name = trim((string) ($body['display_name'] ?? ''));

            if ($name !== '') {
                return response()->json([
                    'display_name' => $name,
                    'address'      => $body['address'] ?? null,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('[REVERSE GEOCODE] Nominatim failed', [
                'lat'   => $data['lat'],
                'lng'   => $data['lng'],
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'display_name' => $fallback,
            'address'      => null,
        ]);
    }

    public function storeLocation()
    {
        return response()->json([
            'data' => [
                'name'      => config('store.name'),
                'address'   => config('store.address'),
                'latitude'  => (float) config('store.latitude'),
                'longitude' => (float) config('store.longitude'),
            ],
        ]);
    }

    public function deliveryFee(Request $request, DeliveryFeeCalculator $calculator)
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');

        if ($lat === null || $lng === null) {
            return response()->json(['error' => 'Missing coordinates'], 400);
        }

        return response()->json(
            $calculator->resolve((float) $lat, (float) $lng)
        );
    }
}