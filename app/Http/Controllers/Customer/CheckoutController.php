<?php

namespace App\Http\Controllers\Customer;
use App\Models\DeliveryZone;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Services\OrderMaterialService;
use App\Services\MaterialCalculationService;
use Illuminate\Http\Request;
use GuzzleHttp\Client;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    /**
     * Show the checkout page with selected cart items.
     */
   public function index(Request $request)
{
    // 1. Get selected cart IDs from query string
    $selectedIds = $request->query('selected', '');
    $selectedIds = $selectedIds ? explode(',', $selectedIds) : [];

    // 2. Retrieve all cart items for the current user
    $cartItems = $this->getCartItems();

    // 3. Filter out items with missing product
    $cartItems = $cartItems->filter(function ($item) {
        return $item->product !== null;
    });

    // 4. Filter by selected IDs
    if (!empty($selectedIds)) {
        $cartItems = $cartItems->filter(function ($item) use ($selectedIds) {
            return in_array($item->id, $selectedIds);
        });
    }

    // 5. If no items selected, redirect
    if ($cartItems->isEmpty()) {
        return redirect()->route('customer.cart.index')
            ->with('error', 'No items selected for checkout. Please select at least one item.');
    }

    // 6. Compute totals
    $subtotal = $cartItems->sum(function ($item) {
        return $item->product->price * $item->quantity;
    });

    $deliveryFee = 100; // placeholder
    $grandTotal = $subtotal + $deliveryFee;

    // ✅ FIX: Calculate downpayment safely (50% of grand total)
    $downPayment = $grandTotal * 0.5;
    $fullPayment = $grandTotal; // For GCash

    $deliveryZones = \App\Models\DeliveryZone::where('is_active', true)->get();

    // 7. Render checkout page
    return Inertia::render('Customer/Checkout/Index', [
        'cartItems' => $cartItems->load('product.images'),
        'subtotal' => $subtotal,
        'deliveryFee' => $deliveryFee,
        'grandTotal' => $grandTotal,
        'downPayment' => $downPayment,
        'fullPayment' => $fullPayment, // if needed in the frontend
        'selectedIds' => $selectedIds,
        'deliveryZones' => $deliveryZones,
    ]);
}

    /**
     * Process the checkout (store order).
     */
public function store(Request $request)
{
    Log::info('[CHECKOUT] Store method started', ['request_data' => $request->all()]);

    try {
        $validated = $request->validate([
            'shipping_address' => 'required|string|max:500',
            'delivery_zone' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'payment_method' => 'required|in:cash_on_delivery,gcash',
            'selected_ids' => 'nullable|string',
        ]);

        Log::info('[CHECKOUT] Validation passed', ['validated' => $validated]);

        $selectedIds = $request->input('selected_ids', '');
        $selectedIds = $selectedIds ? explode(',', $selectedIds) : [];

        $cartItems = $this->getCartItems();
        Log::info('[CHECKOUT] Cart items retrieved', ['count' => $cartItems->count()]);

        $cartItems = $cartItems->filter(function ($item) {
            return $item->product !== null;
        });

        if (!empty($selectedIds)) {
            $cartItems = $cartItems->filter(function ($item) use ($selectedIds) {
                return in_array($item->id, $selectedIds);
            });
        }

        if ($cartItems->isEmpty()) {
            Log::warning('[CHECKOUT] No cart items after filtering');
            return back()->withErrors(['error' => 'No items selected for purchase.']);
        }

        Log::info('[CHECKOUT] Filtered cart items', ['ids' => $cartItems->pluck('id')]);

        $subtotal = $cartItems->sum(function ($item) {
            return $item->product->price * $item->quantity;
        });
        $deliveryFee = 100;
        $total = $subtotal + $deliveryFee;

        $paymentMethod = $validated['payment_method'];
        $paymentType = ($paymentMethod === 'cash_on_delivery') ? 'down_payment' : 'full_payment';
        $amount = ($paymentMethod === 'cash_on_delivery') ? $total * 0.5 : $total;
        $amountInCentavos = (int) ($amount * 100);

        Log::info('[CHECKOUT] Payment details', [
            'payment_method' => $paymentMethod,
            'amount' => $amount,
            'amount_in_centavos' => $amountInCentavos,
        ]);

        $secretKey = config('services.paymongo.secret_key');
        Log::info('[CHECKOUT] PayMongo secret key present', ['key_exists' => !empty($secretKey)]);

        if (empty($secretKey)) {
            throw new \Exception('PayMongo secret key is not configured');
        }

        // ============================================================
        // GENERATE SUCCESS & CANCEL URLs WITH FALLBACK
        // ============================================================
        try {
            $successUrl = route('customer.payment.success');
        } catch (\Exception $e) {
            Log::warning('Success route not defined, using fallback URL');
            $successUrl = url('/customer/payment/success');
        }

        try {
            $cancelUrl = route('customer.payment.cancel');
        } catch (\Exception $e) {
            Log::warning('Cancel route not defined, using fallback URL');
            $cancelUrl = url('/customer/payment/cancel');
        }

        Log::info('[CHECKOUT] Payment URLs', [
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ]);

        // ============================================================
        // CREATE PAYMONGO CHECKOUT SESSION (with SSL fix)
        // ============================================================
        $paymongoClient = new Client([
            'base_uri' => 'https://api.paymongo.com/v2/',
            'auth' => [$secretKey, ''],
            'verify' => false,
        ]);

        $referenceNumber = 'ORD-' . date('Ymd') . '-' . uniqid();

        $payload = [
            'data' => [
                'attributes' => [
                    'line_items' => [
                        [
                            'name' => 'Order #' . $referenceNumber,
                            'amount' => $amountInCentavos,
                            'currency' => 'PHP',
                            'quantity' => 1,
                        ]
                    ],
                    'payment_method_types' => ['card', 'gcash', 'paymaya'],
                    'success_url' => $successUrl,
                    'cancel_url' => $cancelUrl,
                    'reference_number' => $referenceNumber,
                    'metadata' => [
                        'user_id' => Auth::id(),
                        'selected_ids' => implode(',', $selectedIds),
                        'delivery_zone' => $validated['delivery_zone'] ?? '',
                        'shipping_address' => $validated['shipping_address'],
                        'notes' => $validated['notes'] ?? '',
                        'payment_method' => $paymentMethod,
                        'payment_type' => $paymentType,
                        'total_amount' => $total,
                        'downpayment_amount' => ($paymentMethod === 'cash_on_delivery') ? $amount : null,
                    ],
                    'send_email_receipt' => true,
                ]
            ]
        ];

        Log::info('[CHECKOUT] PayMongo request payload', ['payload' => $payload]);

        $response = $paymongoClient->post('checkout_sessions', [
            'json' => $payload
        ]);

        Log::info('[CHECKOUT] PayMongo response status', ['status' => $response->getStatusCode()]);

        $responseData = json_decode($response->getBody(), true);
        $checkoutUrl = $responseData['data']['attributes']['checkout_url'] ?? null;
        $checkoutSessionId = $responseData['data']['id'] ?? null;

        Log::info('[CHECKOUT] PayMongo response data', [
            'checkout_url' => $checkoutUrl,
            'session_id' => $checkoutSessionId,
        ]);

        if (!$checkoutUrl) {
            throw new \Exception('Failed to create checkout session: Missing checkout URL');
        }

        // ============================================================
        // 🆕 STORE SESSION ID AND METADATA
        // ============================================================
        session([
            'paymongo_checkout_session_id' => $checkoutSessionId,
            'paymongo_checkout_metadata' => [
                'user_id' => Auth::id(),
                'selected_ids' => implode(',', $selectedIds),
                'delivery_zone' => $validated['delivery_zone'] ?? '',
                'shipping_address' => $validated['shipping_address'],
                'notes' => $validated['notes'] ?? '',
                'payment_method' => $paymentMethod,
                'payment_type' => $paymentType,
            ]
        ]);
        session()->save(); // Force save

        // Also set cookie as fallback
        $cookie = cookie('paymongo_checkout_session_id', $checkoutSessionId, 60);

        Log::info('[CHECKOUT] Session ID and metadata stored', [
            'session_id' => $checkoutSessionId,
            'metadata' => session('paymongo_checkout_metadata'),
        ]);

        Log::info('[CHECKOUT] Redirecting to PayMongo checkout', ['url' => $checkoutUrl]);

        return Inertia::location($checkoutUrl)->withCookie($cookie);

    } catch (\Illuminate\Validation\ValidationException $e) {
        Log::error('[CHECKOUT] Validation failed', ['errors' => $e->errors()]);
        return back()->withErrors($e->errors());
    } catch (\Exception $e) {
        Log::error('[CHECKOUT] Store method error', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        return back()->withErrors(['error' => 'Unable to process payment. ' . $e->getMessage()]);
    }
}

    /**
     * Helper: Get all cart items for the current user.
     * (If you support guest sessions, extend this.)
     */
    private function getCartItems()
    {
        $userId = Auth::id();
        return Cart::with('product')->where('user_id', $userId)->get();
    }


   public function getZoneByCoordinates(Request $request)
{
    $lat = $request->query('lat');
    $lng = $request->query('lng');

    if (!$lat || !$lng) {
        return response()->json(['error' => 'Missing coordinates'], 400);
    }

    // Fetch active zones that have latitude, longitude, and a radius
    $zones = DeliveryZone::where('is_active', true)
        ->whereNotNull('latitude')
        ->whereNotNull('longitude')
        ->whereNotNull('radius')
        ->get();

    $foundZone = null;

    foreach ($zones as $zone) {
        $distance = $this->haversineDistance($lat, $lng, $zone->latitude, $zone->longitude);
        // If the point is within the zone's radius (in km)
        if ($distance <= $zone->radius) {
            $foundZone = $zone;
            break; // pick the first matching zone (you could also pick the smallest radius)
        }
    }

    return response()->json([
        'zone' => $foundZone,
        'distance' => $foundZone ? $distance : null,
    ]);
}

private function haversineDistance($lat1, $lon1, $lat2, $lon2)
{
    $earthRadius = 6371; // km
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat/2) * sin($dLat/2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon/2) * sin($dLon/2);
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    return $earthRadius * $c;
}
}
