<?php

namespace App\Http\Controllers\Customer;

use App\Services\DeliveryFeeCalculator;
use App\Services\MaterialRequirementCalculator;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Services\OrderMaterialService;
use Illuminate\Http\Request;
use GuzzleHttp\Client;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    public function index(Request $request)
    {
        $selectedIds = $request->query('selected', '');
        $selectedIds = $selectedIds ? explode(',', $selectedIds) : [];

        $cartItems = $this->getCartItems()->filter(fn ($i) => $i->product !== null);

        if (!empty($selectedIds)) {
            $cartItems = $cartItems->filter(fn ($i) => in_array($i->id, $selectedIds));
        }

        if ($cartItems->isEmpty()) {
            return redirect()->route('customer.cart.index')
                ->with('error', 'No items selected for checkout. Please select at least one item.');
        }

        $subtotal = $cartItems->sum(function ($item) {
            $unitPrice = (float) ($item->variant?->price ?? $item->product->price)
                       + (float) ($item->product->labor_cost ?? 0);
            return $unitPrice * $item->quantity;
        });

        $customizationSurcharge = $cartItems->sum(fn ($i) => (float) ($i->customization_surcharge ?? 0));

        $laborSubtotal = $cartItems->sum(
            fn ($i) => (float) ($i->product->labor_cost ?? 0) * $i->quantity
        );
        $woodSubtotal = $subtotal - $laborSubtotal;

        $deliveryFee = 0; // no location yet — calculated live
        $grandTotal  = $subtotal + $customizationSurcharge;

        $cartItems = $cartItems->values()->load([
            'product.images', 'product.finishMaterial', 'variant.images',
        ]);

        foreach ($cartItems as $item) {
            $variantBasePrice = (float) ($item->variant?->price ?? $item->product->price);
            $laborCost        = (float) ($item->product->labor_cost ?? 0);

            $item->variant_base_price = $variantBasePrice;
            $item->labor_cost         = $laborCost;
            $item->base_price         = $variantBasePrice + $laborCost;

            $item->variant_name       = $item->variant?->name;
            $item->display_image_path = $item->variant?->primary_image
                ?? $item->product->images->first()?->path
                ?? null;

            $finishOption = $item->customization_data['finish_option'] ?? 'ordinary';
            $item->finish_name = ($finishOption === 'standard')
                ? 'Standard (' . ($item->product->finishMaterial?->name ?? 'Varnish') . ')'
                : 'Ordinary (No varnish)';
        }

        return Inertia::render('Customer/Checkout/Index', [
            'cartItems'              => $cartItems,
            'subtotal'               => $subtotal,
            'woodSubtotal'           => $woodSubtotal,
            'laborSubtotal'          => $laborSubtotal,
            'customizationSurcharge' => $customizationSurcharge,
            'deliveryFee'            => $deliveryFee,
            'grandTotal'             => $grandTotal,
            'downPayment'            => $grandTotal * 0.5,
            'selectedIds'            => $selectedIds,
            'storeLocation'          => [
                'name'      => config('store.name'),
                'address'   => config('store.address'),
                'latitude'  => (float) config('store.latitude'),
                'longitude' => (float) config('store.longitude'),
            ],
            'estimatedDays'          => (int) config('store.estimated_days', 3),
        ]);
    }

    public function getDeliveryFee(Request $request, DeliveryFeeCalculator $calculator)
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');

        if ($lat === null || $lng === null) {
            return response()->json(['error' => 'Missing coordinates'], 400);
        }

        return response()->json($calculator->resolve((float) $lat, (float) $lng));
    }

    public function store(Request $request, DeliveryFeeCalculator $calculator)
    {
        Log::info('[CHECKOUT] Store started', ['data' => $request->all()]);

        try {
            $validated = $request->validate([
                'shipping_address' => 'required|string|max:500',
                'notes'            => 'nullable|string',
                'payment_method'   => 'required|in:cash_on_delivery,gcash',
                'selected_ids'     => 'nullable|string',
                'latitude'         => 'required|numeric|between:-90,90',
                'longitude'        => 'required|numeric|between:-180,180',
            ]);

            $selectedIds = $request->input('selected_ids', '');
            $selectedIds = $selectedIds ? explode(',', $selectedIds) : [];

            $cartItems = $this->getCartItems()->filter(fn ($i) => $i->product !== null);

            if (!empty($selectedIds)) {
                $cartItems = $cartItems->filter(fn ($i) => in_array($i->id, $selectedIds));
            }

            if ($cartItems->isEmpty()) {
                return back()->withErrors(['error' => 'No items selected for purchase.']);
            }

            $subtotal = $cartItems->sum(function ($item) {
                $unitPrice = (float) ($item->variant?->price ?? $item->product->price)
                           + (float) ($item->product->labor_cost ?? 0);
                return $unitPrice * $item->quantity;
            });

            $customizationSurcharge = $cartItems->sum(
                fn ($i) => (float) ($i->customization_surcharge ?? 0)
            );

            // ── Server-authoritative delivery fee ──
            $deliveryResult = $calculator->resolve(
                (float) $validated['latitude'],
                (float) $validated['longitude']
            );

            if (!$deliveryResult['deliverable']) {
                return back()->withErrors([
                    'error' => "We cannot deliver to this location. It is {$deliveryResult['distance_km']} km from our store, which is outside our delivery range.",
                ]);
            }

            $deliveryFee = (float) $deliveryResult['fee'];
            $deliveryLabel = $deliveryResult['tier']['label'] ?? null;

            $total = $subtotal + $customizationSurcharge + $deliveryFee;

            $paymentMethod = $validated['payment_method'];
            $paymentType   = ($paymentMethod === 'cash_on_delivery') ? 'down_payment' : 'full_payment';
            $amount        = ($paymentMethod === 'cash_on_delivery') ? $total * 0.5 : $total;
            $amountInCentavos = (int) ($amount * 100);

            Log::info('[CHECKOUT] Computed', [
                'subtotal'     => $subtotal,
                'surcharge'    => $customizationSurcharge,
                'delivery'     => $deliveryFee,
                'distance_km'  => $deliveryResult['distance_km'],
                'tier'         => $deliveryLabel,
                'total'        => $total,
            ]);

            try {
                $this->assertMaterialsAvailable($cartItems);
            } catch (\Exception $e) {
                return back()->withErrors(['error' => $e->getMessage()]);
            }

            $secretKey = config('services.paymongo.secret_key');
            if (empty($secretKey)) {
                throw new \Exception('PayMongo secret key is not configured');
            }

            $successUrl = route('customer.payment.success');
            $cancelUrl  = route('customer.payment.cancel');

            $paymongoClient = new Client([
                'base_uri' => 'https://api.paymongo.com/v2/',
                'auth'     => [$secretKey, ''],
                'verify'   => false,
            ]);

            $referenceNumber = 'ORD-' . date('Ymd') . '-' . uniqid();

            $metadata = [
                'user_id'          => Auth::id(),
                'selected_ids'     => implode(',', $selectedIds),
                'delivery_zone'    => $deliveryLabel,           // tier label
                'delivery_fee'     => $deliveryFee,
                'distance_km'      => $deliveryResult['distance_km'],
                'shipping_address' => $validated['shipping_address'],
                'notes'            => $validated['notes'] ?? '',
                'payment_method'   => $paymentMethod,
                'payment_type'     => $paymentType,
                'total_amount'     => $total,
                'downpayment_amount' => ($paymentMethod === 'cash_on_delivery') ? $amount : null,
                'latitude'         => (float) $validated['latitude'],
                'longitude'        => (float) $validated['longitude'],
            ];

            $payload = [
                'data' => ['attributes' => [
                    'line_items' => [[
                        'name' => 'Order #' . $referenceNumber,
                        'amount' => $amountInCentavos,
                        'currency' => 'PHP',
                        'quantity' => 1,
                    ]],
                    'payment_method_types' => ['card', 'gcash', 'paymaya'],
                    'success_url'          => $successUrl,
                    'cancel_url'           => $cancelUrl,
                    'reference_number'     => $referenceNumber,
                    'metadata'             => $metadata,
                    'send_email_receipt'   => true,
                ]],
            ];

            $response = $paymongoClient->post('checkout_sessions', ['json' => $payload]);
            $responseData = json_decode($response->getBody(), true);
            $checkoutUrl      = $responseData['data']['attributes']['checkout_url'] ?? null;
            $checkoutSessionId = $responseData['data']['id'] ?? null;

            if (!$checkoutUrl) {
                throw new \Exception('Failed to create checkout session.');
            }

            session([
                'paymongo_checkout_session_id' => $checkoutSessionId,
                'paymongo_checkout_metadata'   => $metadata,
            ]);
            session()->save();

            $cookie = cookie('paymongo_checkout_session_id', $checkoutSessionId, 60);

            return Inertia::location($checkoutUrl)->withCookie($cookie);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            Log::error('[CHECKOUT] Error', ['message' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Unable to process payment. ' . $e->getMessage()]);
        }
    }

    private function getCartItems()
    {
        return Cart::with(['product', 'variant.images'])
            ->where('user_id', Auth::id())
            ->get();
    }

    private function assertMaterialsAvailable(\Illuminate\Support\Collection $cartItems): void
    {
        $calc = new MaterialRequirementCalculator();
        $required = [];

        foreach ($cartItems as $item) {
            if (!$item->product) continue;

            $customData = $item->customization_data ?? [];
            $partsData = !empty($customData['parts']) && is_array($customData['parts'])
                ? $customData['parts']
                : [];

            if (empty($partsData)) {
                foreach ($customData as $k => $v) {
                    if (is_numeric($k) && is_array($v)) $partsData[$k] = $v;
                }
            }

            $reqs = $calc->calculateForUnit(
                $item->product,
                $partsData,
                $item->variant?->material_id,
                $customData['finish_option'] ?? 'ordinary'
            );

            foreach ($reqs as $materialId => $qtyPerUnit) {
                $required[$materialId] = ($required[$materialId] ?? 0) + ($qtyPerUnit * $item->quantity);
            }
        }

        if (empty($required)) return;

        $materials    = \App\Models\Material::whereIn('id', array_keys($required))->get()->keyBy('id');
        $insufficient = [];

        foreach ($required as $materialId => $needed) {
            $mat = $materials[$materialId] ?? null;
            if (!$mat) continue;

            $available = (float) $mat->stock_quantity;
            if ($needed > $available) {
                $insufficient[] = sprintf(
                    '%s: need %.2f %s, only %.2f available',
                    $mat->name, $needed, $mat->unit ?? 'unit', $available
                );
            }
        }

        if (!empty($insufficient)) {
            throw new \Exception("Not enough raw materials:\n- " . implode("\n- ", $insufficient));
        }
    }
}
