<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\DeliveryZone;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Services\MaterialCalculationService;
use App\Services\OrderMaterialService;
use App\Events\Payment\PaymentReceived;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    /** Cache TTL for pending PayMongo sessions (2 hours). */
    private const SESSION_TTL_SECONDS = 7200;

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
     *  Cash on Delivery (unchanged — keep existing flow)
     * ═══════════════════════════════════════════════════════ */

      public function store(Request $request)
    {
        $validated = $request->validate([
            'shipping_address' => 'required|string|max:1000',
            'delivery_zone_id' => 'required|exists:delivery_zones,id',
            'notes'            => 'nullable|string|max:1000',
            'payment_method'   => 'required|in:cash_on_delivery',
            'selected_ids'     => 'nullable|string',
            'latitude'         => 'nullable|numeric',
            'longitude'        => 'nullable|numeric',
        ]);

        $user = $request->user();

        // ── Parse selected cart IDs ──
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

        $zone = DeliveryZone::findOrFail($validated['delivery_zone_id']);
        $deliveryFee = $zone->fee_type === 'fixed' ? (float) $zone->fee : 0.0;

        try {
            $order = DB::transaction(function () use (
                $user, $validated, $cartItems, $zone, $deliveryFee
            ) {
                $subtotal = 0.0;
                foreach ($cartItems as $c) {
                    $base = (float) ($c->variant?->price ?? $c->product->price);
                    $labor = (float) ($c->product?->labor_cost ?? 0);
                    $surcharge = (float) ($c->customization_surcharge ?? 0);
                    $subtotal += ($base + $labor) * $c->quantity + $surcharge;
                }
                $total = round($subtotal + $deliveryFee, 2);

                $order = Order::create([
                    'user_id'          => $user->id,
                    'order_number'     => Order::generateOrderNumber(),
                    'total'            => $total,
                    'status'           => 'pending',
                    'payment_status'   => 'unpaid',
                    'shipping_address' => $validated['shipping_address'],
                    'delivery_zone'    => $zone->name,
                    'delivery_fee'     => $deliveryFee,
                    'notes'            => $validated['notes'] ?? null,
                    'latitude'         => $validated['latitude'] ?? null,
                    'longitude'        => $validated['longitude'] ?? null,
                ]);

                foreach ($cartItems as $c) {
                    $unit = (float) ($c->variant?->price ?? $c->product->price)
                          + (float) ($c->product?->labor_cost ?? 0);

                    OrderItem::create([
                        'order_id'                => $order->id,
                        'product_id'              => $c->product_id,
                        'variant_id'              => $c->variant_id,
                        'quantity'                => $c->quantity,
                        'price'                   => $unit,
                        'labor_cost'              => $c->product->labor_cost,
                        'labor_status'            => 'pending',
                        'customization_data'      => $c->customization_data,
                        'customization_surcharge' => $c->customization_surcharge ?? 0,
                        'customization_breakdown' => $c->customization_breakdown,
                    ]);
                }

                // Delete only the selected items
                Cart::whereIn('id', $cartItems->pluck('id'))
                    ->where('user_id', $user->id)
                    ->delete();

                return $order;
            });

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
                    'notes'            => $order->notes,
                    'created_at'       => $order->created_at->toIso8601String(),
                ],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('API COD checkout failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Could not place your order. Please try again.'], 500);
        }
    }



    /* ═══════════════════════════════════════════════════════
     *  PayMongo — Step 1: Create checkout session
     * ═══════════════════════════════════════════════════════ */

       public function paymongo(Request $request)
    {
        $validated = $request->validate([
            'shipping_address' => 'required|string|max:1000',
            'delivery_zone_id' => 'required|exists:delivery_zones,id',
            'notes'            => 'nullable|string|max:1000',
            'selected_ids'     => 'nullable|string',
            'payment_method'   => 'required|in:cash_on_delivery,gcash',
            'latitude'         => 'nullable|numeric',
            'longitude'        => 'nullable|numeric',
        ]);

        $user = $request->user();

        // Parse selected cart IDs
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

        $zone = DeliveryZone::findOrFail($validated['delivery_zone_id']);
        $deliveryFee = $zone->fee_type === 'fixed' ? (float) $zone->fee : 0.0;

        $subtotal = 0.0;
        foreach ($cartItems as $c) {
            $base = (float) ($c->variant?->price ?? $c->product->price);
            $labor = (float) ($c->product?->labor_cost ?? 0);
            $surcharge = (float) ($c->customization_surcharge ?? 0);
            $subtotal += ($base + $labor) * $c->quantity + $surcharge;
        }
        $total = round($subtotal + $deliveryFee, 2);

        if ($total <= 0) {
            return response()->json(['message' => 'Invalid order total.'], 422);
        }

        // ── Payment method rules ──
        $isCOD = $validated['payment_method'] === 'cash_on_delivery';
        $paymentType  = $isCOD ? 'down_payment' : 'full_payment';
        $amountToPay  = $isCOD ? round($total * 0.5, 2) : $total;

        $secretKey = config('services.paymongo.secret_key');
        if (empty($secretKey)) {
            return response()->json(['message' => 'Payment gateway not configured.'], 500);
        }

        $baseUrl = rtrim(config('app.url'), '/');
        $successUrl = $baseUrl . '/api/v1/payment/mobile-done?status=success';
        $cancelUrl  = $baseUrl . '/api/v1/payment/mobile-done?status=cancel';

        $referenceNumber = 'MOB-' . date('Ymd') . '-' . strtoupper(uniqid());
        $amountInCentavos = (int) round($amountToPay * 100);

        $metadata = [
            'user_id'          => $user->id,
            'selected_ids'     => $cartItems->pluck('id')->implode(','),
            'delivery_zone'    => $zone->name,
            'delivery_fee'     => $deliveryFee,
            'shipping_address' => $validated['shipping_address'],
            'notes'            => $validated['notes'] ?? '',
            'payment_method'   => $validated['payment_method'],   // cash_on_delivery | gcash
            'payment_type'     => $paymentType,                    // down_payment | full_payment
            'total_amount'     => $total,
            'amount_to_pay'    => $amountToPay,
            'latitude'         => $validated['latitude'] ?? null,
            'longitude'        => $validated['longitude'] ?? null,
        ];

        // GCash → restrict to GCash. COD → allow any online method for the down payment.
        $paymentMethodTypes = $isCOD
            ? ['card', 'gcash', 'paymaya']
            : ['gcash'];

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

            $response = $client->post('checkout_sessions', ['json' => $payload]);
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
     *  PayMongo — Step 2: Verify payment + create order
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

        // ── 1. Already processed? (webhook or prior verify won the race) ──
        $existing = Payment::where('transaction_id', $sessionId)->first();
        if ($existing) {
            Log::info('[VERIFY] Already processed', [
                'session_id' => $sessionId,
                'order_id'   => $existing->order_id,
            ]);
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
            Log::warning('[VERIFY] Cache miss or user mismatch', [
                'session_id'    => $sessionId,
                'cache_present' => (bool) $cached,
                'cache_user'    => $cached['user_id'] ?? null,
                'request_user'  => $user->id,
            ]);
            return response()->json([
                'status'  => 'failed',
                'message' => 'Payment session not found or expired.',
            ], 404);
        }

        $metadata = $cached['metadata'];
        Log::info('[VERIFY] Cache hit — querying PayMongo', [
            'session_id' => $sessionId,
        ]);

        // ── 3. Query PayMongo ──
               $secretKey = config('services.paymongo.secret_key');

        // ⚠️ IMPORTANT: PayMongo uses v2 for CREATE and v1 for RETRIEVE.
        // The v2 endpoint for retrieving a checkout session does not exist,
        // which is why we were getting 404 "route does not exist" responses.
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
            Log::warning('[VERIFY] PayMongo lookup failed', [
                'session_id' => $sessionId,
                'error'      => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => 'pending',
                'message' => 'Still confirming with payment provider.',
            ], 202);
        }

        // ── 4. Extract every relevant field so we can see what's happening ──
        $sessionStatus = $data['data']['attributes']['status'] ?? null;
        $payments      = $data['data']['attributes']['payments'] ?? [];
        $paymentIntent = $data['data']['attributes']['payment_intent'] ?? null;

        $normalisedPayments = array_map(function ($p) {
            return [
                'id'     => $p['id'] ?? null,
                'status' => $p['attributes']['status'] ?? null,
                'amount' => $p['attributes']['amount'] ?? null,
            ];
        }, $payments);

        Log::info('[VERIFY] PayMongo response', [
            'session_id'     => $sessionId,
            'session_status' => $sessionStatus,
            'payments_count' => count($payments),
            'payments'       => $normalisedPayments,
            'has_intent'     => (bool) $paymentIntent,
        ]);

        // ── 5. Determine paid status (multiple signals) ──
        $hasPaid = false;
        foreach ($payments as $p) {
            $status = $p['attributes']['status'] ?? null;
            // PayMongo uses `paid` for completed and `authorized` for pre-captured
            if (in_array($status, ['paid', 'authorized'], true)) {
                $hasPaid = true;
                break;
            }
        }

        $isPaid = $sessionStatus === 'completed' || $hasPaid;

        if (!$isPaid) {
            Log::info('[VERIFY] Not yet paid — retry', [
                'session_id'     => $sessionId,
                'session_status' => $sessionStatus,
                'has_paid'       => $hasPaid,
            ]);
            return response()->json([
                'status'         => 'pending',
                'debug'          => [
                    'session_status' => $sessionStatus,
                    'payments'       => $normalisedPayments,
                ],
            ], 202);
        }

        // ── 6. Create the order ──
        Log::info('[VERIFY] Payment confirmed — creating order', [
            'session_id' => $sessionId,
        ]);

        $order = $this->createOrderFromMetadata(
            $user->id,
            $sessionId,
            $metadata,
            (float) $cached['total'],
            (float) ($cached['amount_to_pay'] ?? $cached['total'])
        );

        if (!$order) {
            Log::error('[VERIFY] Order creation returned null', [
                'session_id' => $sessionId,
            ]);
            return response()->json([
                'status'  => 'failed',
                'message' => 'Payment confirmed but order could not be created. Contact support.',
            ], 500);
        }

        Cache::forget('paymongo_mobile:' . $sessionId);

        Log::info('[VERIFY] Order created', [
            'session_id' => $sessionId,
            'order_id'   => $order->id,
            'order_num'  => $order->order_number,
        ]);

        return response()->json([
            'status' => 'paid',
            'order'  => $this->serializeOrder($order),
            'source' => 'live',
        ]);
    }

    /* ═══════════════════════════════════════════════════════
     *  Shared: create order from cached metadata
     * ═══════════════════════════════════════════════════════ */

       private function createOrderFromMetadata(
        int $userId,
        string $sessionId,
        array $metadata,
        float $total,
        float $amountToPay
    ): ?Order {
        // Idempotency guard (webhook may have won the race)
        if (Payment::where('transaction_id', $sessionId)->exists()) {
            $existing = Payment::where('transaction_id', $sessionId)->first();
            return Order::with('items')->find($existing->order_id);
        }

        $selectedIds = array_filter(explode(',', $metadata['selected_ids'] ?? ''));

        $cartQuery = Cart::with(['product', 'variant'])->where('user_id', $userId);
        if (!empty($selectedIds)) {
            $cartQuery->whereIn('id', $selectedIds);
        }
        $cartItems = $cartQuery->get();

        if ($cartItems->isEmpty()) {
            Log::warning('[MOBILE VERIFY] Cart empty for order creation', [
                'user_id' => $userId,
                'session' => $sessionId,
            ]);
            return null;
        }

        $deliveryFee   = (float) ($metadata['delivery_fee'] ?? 0);
        $paymentType   = $metadata['payment_type'] ?? 'full_payment';
        $isFullPayment = $paymentType === 'full_payment';

        $materialService = new OrderMaterialService(new MaterialCalculationService());

        try {
            $payment = null;

            DB::transaction(function () use (
                $userId, $sessionId, $metadata, $cartItems, $total, $deliveryFee,
                $amountToPay, $paymentType, $isFullPayment, $materialService, &$payment
            ) {
                $order = Order::create([
                    'user_id'          => $userId,
                    'order_number'     => Order::generateOrderNumber(),
                    'total'            => $total,
                    'status'           => 'accepted',
                    'payment_status'   => $isFullPayment ? 'paid' : 'partially_paid',
                    'shipping_address' => $metadata['shipping_address'] ?? '',
                    'delivery_zone'    => $metadata['delivery_zone'] ?? null,
                    'delivery_fee'     => $deliveryFee,
                    'notes'            => $metadata['notes'] ?? null,
                    'latitude'         => $metadata['latitude'] ?? null,
                    'longitude'        => $metadata['longitude'] ?? null,
                ]);

                foreach ($cartItems as $c) {
                    $unit = (float) ($c->variant?->price ?? $c->product->price)
                          + (float) ($c->product?->labor_cost ?? 0);

                    $orderItem = OrderItem::create([
                        'order_id'                => $order->id,
                        'product_id'              => $c->product_id,
                        'variant_id'              => $c->variant_id,
                        'quantity'                => $c->quantity,
                        'price'                   => $unit,
                        'labor_cost'              => $c->product->labor_cost,
                        'labor_status'            => 'pending',
                        'customization_data'      => $c->customization_data,
                        'customization_surcharge' => $c->customization_surcharge ?? 0,
                        'customization_breakdown' => $c->customization_breakdown,
                    ]);

                    try {
                        $materialService->processOrderItemMaterials(
                            $orderItem,
                            $c->product,
                            $c->customization_data ?? []
                        );
                    } catch (\Throwable $e) {
                        Log::error('[MOBILE VERIFY] Material service failed', [
                            'order_item_id' => $orderItem->id,
                            'error'         => $e->getMessage(),
                        ]);
                        throw $e;
                    }
                }

                $payment = Payment::create([
                    'order_id'       => $order->id,
                    'amount'         => $amountToPay,
                    'method'         => 'paymongo',
                    'status'         => 'paid',
                    'type'           => $paymentType,
                    'transaction_id' => $sessionId,
                    'paid_at'        => now(),
                ]);

                Cart::whereIn('id', $cartItems->pluck('id'))
                    ->where('user_id', $userId)
                    ->delete();
            });

            if ($payment) {
                PaymentReceived::dispatch($payment);
            }

            return Payment::where('transaction_id', $sessionId)
                ->first()?->order()->with('items')->first();

        } catch (\Throwable $e) {
            Log::error('[MOBILE VERIFY] Order creation failed', [
                'session_id' => $sessionId,
                'error'      => $e->getMessage(),
                'trace'      => $e->getTraceAsString(),
            ]);
            return null;
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

        // Never return empty — always give the customer something useful
        return response()->json([
            'display_name' => $fallback,
            'address'      => null,
        ]);
    }



}
