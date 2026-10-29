<?php

namespace App\Http\Controllers\Customer;
use App\Services\MaterialRequirementCalculator;
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


        /**
     * CHECKOUT PAGE
     * Reads the selected cart item IDs from the query string, loads the current
     * user's cart, drops items whose product no longer exists, and keeps only
     * the selected ones. If nothing is left → bounce back to the cart page.
     *
     * Computes:
     *   - subtotal              = Σ (variant price + labor) × qty
     *   - customizationSurcharge = Σ item surcharges
     *   - deliveryFee           = default 100 (frontend recalculates live via map)
     *   - grandTotal, downPayment (50%), fullPayment (100%)
     *
     * Decorates each item with display fields (base_price, variant info, image),
     * loads delivery zones, and renders Customer/Checkout/Index.
     */
   public function index(Request $request)
{
    $selectedIds = $request->query('selected', '');
    $selectedIds = $selectedIds ? explode(',', $selectedIds) : [];

    $cartItems = $this->getCartItems();

    $cartItems = $cartItems->filter(function ($item) {
        return $item->product !== null;
    });

    if (!empty($selectedIds)) {
        $cartItems = $cartItems->filter(function ($item) use ($selectedIds) {
            return in_array($item->id, $selectedIds);
        });
    }

    if ($cartItems->isEmpty()) {
        return redirect()->route('customer.cart.index')
            ->with('error', 'No items selected for checkout. Please select at least one item.');
    }

    // ── Subtotal — includes labor cost ──
    $subtotal = $cartItems->sum(function ($item) {
        $unitPrice = (float) ($item->variant?->price ?? $item->product->price)
                   + (float) ($item->product->labor_cost ?? 0);
        return $unitPrice * $item->quantity;
    });

    $customizationSurcharge = $cartItems->sum(function ($item) {
        return (float) ($item->customization_surcharge ?? 0);
    });

    // Default delivery fee — customer hasn't picked a zone yet on this page.
    // The frontend recalculates this live as they click on the map.
    $deliveryFee = 100;

    $grandTotal  = $subtotal + $customizationSurcharge + $deliveryFee;
    $downPayment = $grandTotal * 0.5;
    $fullPayment = $grandTotal;

    $deliveryZones = DeliveryZone::where('is_active', true)->get();

    $cartItems = $cartItems->values()->load(['product.images', 'variant.images']);

    // ── Decorate each item with variant-aware fields (labor-inclusive price) ──
    foreach ($cartItems as $item) {
        $item->base_price = (float) ($item->variant?->price ?? $item->product->price)
                          + (float) ($item->product->labor_cost ?? 0);
        $item->variant_name       = $item->variant?->name;
        $item->variant_slug       = $item->variant?->slug;
        $item->display_image_path = $item->variant?->primary_image
            ?? $item->product->images->first()?->path
            ?? null;
    }

    return Inertia::render('Customer/Checkout/Index', [
        'cartItems'              => $cartItems,
        'subtotal'               => $subtotal,
        'customizationSurcharge' => $customizationSurcharge,
        'deliveryFee'            => $deliveryFee,
        'grandTotal'             => $grandTotal,
        'downPayment'            => $downPayment,
        'fullPayment'            => $fullPayment,
        'selectedIds'            => $selectedIds,
        'deliveryZones'          => $deliveryZones,
    ]);
}




    /**
     * Process the checkout (store order).
     */


// PROCESS CHECKOUT - Dinhi magsugod ang proseso sa pagbayad gamit ang PayMongo.
//
// Phase A: I-check kung kompleto ug sakto ang mga input sa customer, sama sa address,
// payment method, delivery zone, ug location coordinates (latitude ug longitude).
//
// Phase B: Kuhaon pag-usab ang cart gikan sa database ug kwentahon pag-usab ang total
// sa server aron masiguro nga sakto ang presyo ug dili mabag-o sa browser ang bayranan.
//
// Phase C: Kwentahon kung pila ang bayran karon. Kung Cash on Delivery (COD), 50%
// nga down payment ang bayran. Kung GCash, 100% o full payment ang bayran.
// I-convert ang amount ngadto sa centavos kay mao kini ang format nga gigamit sa PayMongo.
//
// Phase D: I-check kung igo ba ang available materials para mahimo ang order
// aron malikayan nga makabayad ang customer sa produkto nga dili mahimo.
//
// Phase E: Maghimo og PayMongo checkout session ug kuhaon ang checkout URL.
// Kini ang payment page diin makapadayon ang customer sa pagbayad.
//
// Phase F: I-save ang checkout session ID ug ang importanteng order details sa
// Laravel session, cookie, ug PayMongo metadata aron makuha pa kini bisan mawala
// ang session o cookie.
//
// Phase G: I-redirect ang customer ngadto sa PayMongo payment page gamit ang
// Inertia::location().
//
// IMPORTANTE: Dinhi nga function, wala pa gihimo ang order sa database, wala pa
// gi-deduct ang materials, ug wala pa gi-clear ang cart. Kay basin dili ipadayon
// sa customer ang pagbayad.
//
// Human makompleto ang payment, didto pa himoon ang order ug order items, i-record
// ang payment, i-deduct ang materials, ug tangtangon ang napalit nga items sa cart.
// Mao ni ang flow: i-check una ang materials, dayon bayad, unya i-record ang order.
    public function store(Request $request)
{
    Log::info('[CHECKOUT] Store method started', ['request_data' => $request->all()]);

    try {
        $validated = $request->validate([
            'shipping_address' => 'required|string|max:500',
            'delivery_zone'    => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
            'payment_method'   => 'required|in:cash_on_delivery,gcash',
            'selected_ids'     => 'nullable|string',
            'latitude'         => 'nullable|numeric|between:-90,90',
            'longitude'        => 'nullable|numeric|between:-180,180',
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

        // ── Subtotal — includes labor cost ──
        $subtotal = $cartItems->sum(function ($item) {
            $unitPrice = (float) ($item->variant?->price ?? $item->product->price)
                       + (float) ($item->product->labor_cost ?? 0);
            return $unitPrice * $item->quantity;
        });

        $customizationSurcharge = $cartItems->sum(function ($item) {
            return (float) ($item->customization_surcharge ?? 0);
        });

        // ── Resolve delivery fee from the selected zone ──
        $deliveryFee = 100; // fallback default
        if (!empty($validated['delivery_zone'])) {
            $zone = DeliveryZone::where('name', $validated['delivery_zone'])->first();
            if ($zone) {
                $deliveryFee = $zone->fee_type === 'free'
                    ? 0
                    : (float) $zone->fee;
            }
        }

        $total = $subtotal + $customizationSurcharge + $deliveryFee;

        $paymentMethod = $validated['payment_method'];
        $paymentType   = ($paymentMethod === 'cash_on_delivery') ? 'down_payment' : 'full_payment';
        $amount        = ($paymentMethod === 'cash_on_delivery') ? $total * 0.5 : $total;
        $amountInCentavos = (int) ($amount * 100);

        Log::info('[CHECKOUT] Payment details', [
            'subtotal'                => $subtotal,
            'customization_surcharge' => $customizationSurcharge,
            'delivery_fee'            => $deliveryFee,
            'delivery_zone'           => $validated['delivery_zone'] ?? null,
            'total'                   => $total,
            'payment_method'          => $paymentMethod,
            'amount'                  => $amount,
            'amount_in_centavos'      => $amountInCentavos,
        ]);

        // ── Pre-check: block checkout if raw materials are insufficient ──
try {
    $this->assertMaterialsAvailable($cartItems);
} catch (\Exception $e) {
    Log::warning('[CHECKOUT] Material pre-check failed', ['error' => $e->getMessage()]);
    return back()->withErrors(['error' => $e->getMessage()]);
}



        $secretKey = config('services.paymongo.secret_key');
        Log::info('[CHECKOUT] PayMongo secret key present', ['key_exists' => !empty($secretKey)]);

        if (empty($secretKey)) {
            throw new \Exception('PayMongo secret key is not configured');
        }

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
            'cancel_url'  => $cancelUrl,
        ]);

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
                        'user_id'            => Auth::id(),
                        'selected_ids'       => implode(',', $selectedIds),
                        'delivery_zone'      => $validated['delivery_zone'] ?? '',
                        'delivery_fee'       => $deliveryFee,
                        'shipping_address'   => $validated['shipping_address'],
                        'notes'              => $validated['notes'] ?? '',
                        'payment_method'     => $paymentMethod,
                        'payment_type'       => $paymentType,
                        'total_amount'       => $total,
                        'downpayment_amount' => ($paymentMethod === 'cash_on_delivery') ? $amount : null,
                        'latitude'           => $validated['latitude'] ?? null,
                        'longitude'          => $validated['longitude'] ?? null,
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
            'session_id'   => $checkoutSessionId,
        ]);

        if (!$checkoutUrl) {
            throw new \Exception('Failed to create checkout session: Missing checkout URL');
        }

        session([
            'paymongo_checkout_session_id' => $checkoutSessionId,
            'paymongo_checkout_metadata' => [
                'user_id'          => Auth::id(),
                'selected_ids'     => implode(',', $selectedIds),
                'delivery_zone'    => $validated['delivery_zone'] ?? '',
                'delivery_fee'     => $deliveryFee,
                'shipping_address' => $validated['shipping_address'],
                'notes'            => $validated['notes'] ?? '',
                'payment_method'   => $paymentMethod,
                'payment_type'     => $paymentType,
                'latitude'         => $validated['latitude'] ?? null,
                'longitude'        => $validated['longitude'] ?? null,
            ]
        ]);
        session()->save();

        $cookie = cookie('paymongo_checkout_session_id', $checkoutSessionId, 60);

        Log::info('[CHECKOUT] Session ID and metadata stored', [
            'session_id' => $checkoutSessionId,
            'metadata'   => session('paymongo_checkout_metadata'),
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
     * Helper: Get all cart items for the current user — variant-aware.
     */
    private function getCartItems()
    {
        $userId = Auth::id();
        return Cart::with(['product', 'variant.images'])
            ->where('user_id', $userId)
            ->get();
    }


    /**
 * Verify that all raw materials needed for the order are on hand.
 * Throws with a clear error message if anything is short.
 */
private function assertMaterialsAvailable(\Illuminate\Support\Collection $cartItems): void
{
    $calc     = new MaterialRequirementCalculator();
    $required = [];  // [material_id => total qty]

    foreach ($cartItems as $item) {
        if (!$item->product) continue;

        $customData = $item->customization_data ?? [];

        // Resolve parts data (handles both flat and nested shapes)
        if (!empty($customData['parts']) && is_array($customData['parts'])) {
            $partsData = $customData['parts'];
        } else {
            $partsData = [];
            foreach ($customData as $k => $v) {
                if (is_numeric($k) && is_array($v)) $partsData[$k] = $v;
            }
        }

        $finishOption      = $customData['finish_option'] ?? 'ordinary';
        $variantMaterialId = $item->variant?->material_id;

        $reqs = $calc->calculateForUnit(
            $item->product,
            $partsData,
            $variantMaterialId,
            $finishOption
        );

        foreach ($reqs as $materialId => $qtyPerUnit) {
            $required[$materialId] = ($required[$materialId] ?? 0) + ($qtyPerUnit * $item->quantity);
        }
    }

    if (empty($required)) return;

    $materials   = \App\Models\Material::whereIn('id', array_keys($required))->get()->keyBy('id');
    $insufficient = [];

    foreach ($required as $materialId => $needed) {
        $mat = $materials[$materialId] ?? null;
        if (!$mat) continue;

        $available = (float) $mat->stock_quantity;
        if ($needed > $available) {
            $insufficient[] = sprintf(
                '%s: need %.2f %s, only %.2f available (short by %.2f)',
                $mat->name,
                $needed,
                $mat->unit ?? 'unit',
                $available,
                $needed - $available
            );
        }
    }

    if (!empty($insufficient)) {
        throw new \Exception(
            "Not enough raw materials to build this order:\n- " . implode("\n- ", $insufficient)
        );
    }
}

    public function getZoneByCoordinates(Request $request)
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');

        if (!$lat || !$lng) {
            return response()->json(['error' => 'Missing coordinates'], 400);
        }

        $zones = DeliveryZone::where('is_active', true)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereNotNull('radius')
            ->get();

        $foundZone = null;

        foreach ($zones as $zone) {
            $distance = $this->haversineDistance($lat, $lng, $zone->latitude, $zone->longitude);
            if ($distance <= $zone->radius) {
                $foundZone = $zone;
                break;
            }
        }

        return response()->json([
            'zone' => $foundZone,
            'distance' => $foundZone ? $distance : null,
        ]);
    }

    private function haversineDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return $earthRadius * $c;
    }
}
