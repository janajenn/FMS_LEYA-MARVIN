<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use App\Models\Material;
use App\Services\CustomizationPricingService;
use App\Services\MaterialCalculationService;
use App\Services\OrderMaterialService; // <--- NEW
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    protected CustomizationPricingService $pricingService;
    protected OrderMaterialService $orderMaterialService; // <--- NEW

   public function __construct()
{
    // Pricing still uses the legacy MaterialCalculationService.
    $pricingCalculator = new MaterialCalculationService();
    $this->pricingService = new CustomizationPricingService($pricingCalculator);

    // Order deduction uses the new MaterialRequirementCalculator internally.
    // Passing nothing lets OrderMaterialService create its own instance.
    $this->orderMaterialService = new OrderMaterialService();
}

    // ─────────────────────────────────────────────────────────────
    // INDEX — shows cart + total (reads stored breakdown JSON)
    // ─────────────────────────────────────────────────────────────
   public function index()
{
    $cartItems = $this->getCartItems();
    $cartItems->load([
    'product.images',
    'product.parts.designs',
    'product.finishMaterial',   // ← add this
    'variant.images',
]);
    $cartItems = $cartItems->filter(fn ($item) => $item->product !== null);

    foreach ($cartItems as $item) {
        // Finish label
        $finishOption = $item->customization_data['finish_option'] ?? 'ordinary';
        if ($finishOption === 'standard') {
            $finishMat = $item->product->finishMaterial?->name ?? 'Varnish';
            $item->finish_name = "Standard ($finishMat)";
        } else {
            $item->finish_name = "Ordinary (No varnish)";
        }

        // Full breakdown – expose everything, not just rows
        $stored = $item->customization_breakdown ?? [];
        $item->customization_breakdown = $stored['rows'] ?? null;      // keep existing shape
        $item->finish_surcharge        = (float) ($stored['finish_surcharge'] ?? 0);
        $item->design_surcharge        = (float) ($stored['design_surcharge'] ?? 0);
        $item->material_cost_standard  = (float) ($stored['material_cost_standard'] ?? 0);
        $item->material_cost_custom    = (float) ($stored['material_cost_custom'] ?? 0);
        $item->material_cost_diff      = (float) ($stored['material_cost_diff'] ?? 0);
        $item->markup_percent          = (float) ($stored['markup_percent'] ?? 0);

        // Price info
        $productBasePrice = (float) ($item->variant?->price ?? $item->product->price);
        $laborCost        = (float) ($item->product->labor_cost ?? 0);

        $item->base_price     = $productBasePrice + $laborCost;
        $item->variant_name   = $item->variant?->name;
        $item->variant_slug   = $item->variant?->slug;
        $item->variant_images = $item->variant?->images ?? [];
        $item->display_image_path = $item->variant?->primary_image
            ?? $item->product->images->first()?->path
            ?? null;
    }

    $total = $cartItems->sum(function ($item) {
        $unit = (float) ($item->variant?->price ?? $item->product->price)
              + (float) ($item->product->labor_cost ?? 0);
        return $unit * $item->quantity + (float) ($item->customization_surcharge ?? 0);
    });

    return Inertia::render('Customer/Cart/CartIndex', [
        'cartItems' => $cartItems->values()->toArray(),
        'total'     => (float) $total,
    ]);
}




    // ─────────────────────────────────────────────────────────────
    // STORE — legacy direct-order creation (no PayMongo)
    // ─────────────────────────────────────────────────────────────


        /**
     * PLACE ORDER (legacy direct-order path, no PayMongo)
     * 1. Read the selected cart item IDs from the request.
     * 2. Fetch the user's cart and keep only the selected items.
     * 3. (Product stock check is skipped — made-to-order model.)
     * 4. Compute subtotal + customization surcharge + delivery fee = total.
     * 5. In a DB transaction:
     *      - Create the Order row,
     *      - Create each OrderItem snapshotting price, customization data/breakdown, labor,
     *      - Deduct RAW MATERIALS via OrderMaterialService (not product stock),
     *      - Delete the purchased cart items.
     * Then redirect to the customer's orders page.
     */
    public function store(Request $request)
    {
        // 1. Get selected IDs
        $selectedIds = $request->input('selected_ids', []);
        if (is_string($selectedIds)) {
            $selectedIds = $selectedIds ? explode(',', $selectedIds) : [];
        }

        // 2. Retrieve cart items
        $cartItems = $this->getCartItems();
        $cartItems->load('product');

        if (!empty($selectedIds)) {
            $cartItems = $cartItems->filter(function ($item) use ($selectedIds) {
                return in_array($item->id, $selectedIds);
            });
        }

        if ($cartItems->isEmpty()) {
            return back()->withErrors(['error' => 'No items selected for purchase.']);
        }

        // 3. (Removed Product Stock Validation - Option A is Made-to-Order)

        // 4. Compute totals
        $subtotal = $cartItems->sum(function ($item) {
            $unit = (float) ($item->variant?->price ?? $item->product->price)
                  + (float) ($item->product->labor_cost ?? 0);
            return $unit * $item->quantity;
        });

        $customizationSurcharge = $cartItems->sum(function ($item) {
            return (float) ($item->customization_surcharge ?? 0);
        });

        $deliveryFee = 100;
        $total = $subtotal + $customizationSurcharge + $deliveryFee;

        // 5. Create order + order items inside a transaction
        $order = null;

        DB::transaction(function () use ($cartItems, $total, $deliveryFee, $subtotal, $customizationSurcharge, &$order) {
            $order = \App\Models\Order::create([
                'user_id'        => Auth::id(),
                'order_number'   => \App\Models\Order::generateOrderNumber(),
                'total'          => $total,
                'status'         => 'pending',
                'payment_status' => 'pending',
                'delivery_fee'   => $deliveryFee,
            ]);

            Log::info('[CART STORE] Order created', [
                'order_id'                => $order->id,
                'subtotal'                => $subtotal,
                'customization_surcharge' => $customizationSurcharge,
                'delivery_fee'            => $deliveryFee,
                'total'                   => $total,
            ]);

            // Create Order Items
            foreach ($cartItems as $item) {
                $unit = (float) ($item->variant?->price ?? $item->product->price)
                      + (float) ($item->product->labor_cost ?? 0);

                $order->items()->create([
                    'product_id'              => $item->product_id,
                    'variant_id'              => $item->variant_id,
                    'quantity'                => $item->quantity,
                    'price'                   => $unit,
                    'customization_surcharge' => (float) ($item->customization_surcharge ?? 0),
                    'customization_breakdown' => $item->customization_breakdown,
                    'customization_data'      => $item->customization_data,
                    'labor_cost'              => $item->product->labor_cost,
                    'labor_status'            => 'pending',
                    'finish_option'           => $item->customization_data['finish_option'] ?? 'ordinary', // Snapshot finish option
                ]);
            }

            // --- ⚠️ NEW: DEDUCT MATERIALS INSTEAD OF PRODUCT STOCK ---
            // Because we are Made-to-Order, we don't reduce `products.stock_quantity`.
            // We reduce `materials.stock_quantity`.
            $this->orderMaterialService->deductForOrder($order);

            // Delete purchased items from cart
            $cartItemIds = $cartItems->pluck('id')->toArray();
            Cart::whereIn('id', $cartItemIds)
                ->where('user_id', Auth::id())
                ->delete();
        });

        return redirect()->route('customer.orders.index')
            ->with('success', 'Order placed successfully!');
    }

public function edit(Cart $cart)
{
    $this->authorizeCartItem($cart);

    $product = Product::where('id', $cart->product_id)
        ->with([
            'category',
            'images' => fn ($q) => $q->whereNull('variant_id')->orderBy('sort_order'),
            'parts'  => fn ($q) => $q->orderBy('sort_order'),
            'parts.designs' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'variants' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'variants.images',
            'finishMaterial',
        ])
        ->firstOrFail();

    return Inertia::render('Customer/Shop/Show', [
        'product'  => $product,
        'units'    => $this->unitProps(),
        'cartItem' => [
            'id'                      => $cart->id,
            'variant_id'              => $cart->variant_id,
            'quantity'                => $cart->quantity,
            'customization_data'      => $cart->customization_data ?? [],
            'customization_surcharge' => (float) ($cart->customization_surcharge ?? 0),
        ],
    ]);
}




    /**
     * UPDATE CUSTOMIZATION
     * Authorizes the cart item, validates the new quantity / variant / customization,
     * recomputes the surcharge + breakdown via computePricing(), then saves all
     * of that back onto the cart row.
     */

public function updateCustomization(Request $request, Cart $cart)
{
    $this->authorizeCartItem($cart);

    $validated = $request->validate([
        'quantity'      => 'required|integer|min:1',
        'variant_id'    => 'required|exists:product_variants,id',
        'customization' => 'nullable|array',
    ]);

    $product = $cart->product;
    if (!$product) {
        return back()->withErrors(['error' => 'Product no longer available.']);
    }

    $customization = $validated['customization'] ?? [];
    $pricing       = $this->computePricing($product, $customization, $validated['quantity']);

    $cart->update([
        'quantity'                => $validated['quantity'],
        'variant_id'              => $validated['variant_id'],
        'customization_data'      => $customization,
        'customization_surcharge' => $pricing['surcharge'],
        'customization_breakdown' => $pricing['breakdown'],
    ]);

    return redirect()
        ->route('customer.cart.index')
        ->with('success', 'Cart item updated.');
}


    // ─────────────────────────────────────────────────────────────
    // ADD — main entry point from product page
    // ─────────────────────────────────────────────────────────────


        /**
     * ADD TO CART (main entry point from product page)
     * Parses the raw JSON payload (or falls back to $request->all()),
     * validates the input, checks product stock, then:
     *   - If the same product + variant + customization already exists for this
     *     user/session → increment its quantity and recompute pricing.
     *   - Otherwise → create a new cart row with the computed surcharge + breakdown.
     * Guest users are keyed by session_id; logged-in users by user_id.
     */
    public function add(Request $request)
    {
        $rawContent = $request->getContent();
        Log::info('Raw request content:', ['raw' => $rawContent]);

        $data = json_decode($rawContent, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
            Log::info('Decoded JSON payload:', $data);
        } else {
            $data = $request->all();
            Log::info('Fallback to $request->all():', $data);
        }

        $validator = validator($data, [
            'product_id'    => 'required|exists:products,id',
            'quantity'      => 'required|integer|min:1',
            'customization' => 'nullable',
            'variant_id'    => 'nullable|exists:product_variants,id',
        ]);

        if ($validator->fails()) {
            Log::error('Validation failed:', $validator->errors()->toArray());
            return back()->withErrors($validator->errors())->withInput();
        }

        $validated = $validator->validated();

        $product = Product::find($validated['product_id']);
        if ($product->stock_quantity < $validated['quantity']) {
            Log::warning('Not enough stock', ['product_id' => $product->id]);
            return back()->withErrors(['quantity' => 'Not enough stock.']);
        }

        $userId    = Auth::id();
        $sessionId = session()->getId();

        $customization = $validated['customization'] ?? [];
        if (is_object($customization)) {
            $customization = (array) $customization;
        }
        $customizationJson = json_encode($customization);

        $variantId = $validated['variant_id'] ?? null;

        $cartItem = Cart::where('product_id', $validated['product_id'])
            ->where('customization_data', $customizationJson)
            ->where('variant_id', $variantId)
            ->when($userId, function ($query) use ($userId) {
                return $query->where('user_id', $userId);
            }, function ($query) use ($sessionId) {
                return $query->where('session_id', $sessionId);
            })
            ->first();

        if ($cartItem) {
            $cartItem->quantity += $validated['quantity'];

            $pricing = $this->computePricing($product, $customization, $cartItem->quantity);
            $cartItem->customization_surcharge = $pricing['surcharge'];
            $cartItem->customization_breakdown = $pricing['breakdown'];

            $cartItem->save();

            Log::info('Updated existing cart item', [
                'cart_id'      => $cartItem->id,
                'variant_id'   => $variantId,
                'new_quantity' => $cartItem->quantity,
                'surcharge'    => $cartItem->customization_surcharge,
            ]);
        } else {
            $pricing = $this->computePricing($product, $customization, $validated['quantity']);

            Cart::create([
                'user_id'                 => $userId,
                'session_id'              => $userId ? null : $sessionId,
                'product_id'              => $validated['product_id'],
                'variant_id'              => $variantId,
                'quantity'                => $validated['quantity'],
                'customization_data'      => $customization,
                'customization_surcharge' => $pricing['surcharge'],
                'customization_breakdown' => $pricing['breakdown'],
            ]);

            Log::info('Created new cart item', [
                'variant_id' => $variantId,
                'surcharge'  => $pricing['surcharge'],
            ]);
        }

        return redirect()->back()->with('success', 'Product added to cart!');
    }

    // ─────────────────────────────────────────────────────────────
    // UPDATE — quantity change
    // ─────────────────────────────────────────────────────────────
    public function update(Request $request)
    {
        $validated = $request->validate([
            'cart_id'  => 'required|exists:carts,id',
            'quantity' => 'required|integer|min:0',
        ]);

        $cartItem = $this->getCartItem($validated['cart_id']);
        if (!$cartItem) {
            return back()->withErrors(['error' => 'Cart item not found.']);
        }

        if ($validated['quantity'] <= 0) {
            $cartItem->delete();
        } else {
            $cartItem->quantity = $validated['quantity'];

            $product = $cartItem->product;
            if ($product && $product->is_customizable && !empty($cartItem->customization_data)) {
                $pricing = $this->computePricing(
                    $product,
                    $cartItem->customization_data,
                    $validated['quantity']
                );
                $cartItem->customization_surcharge = $pricing['surcharge'];
                $cartItem->customization_breakdown = $pricing['breakdown'];
            }

            $cartItem->save();
        }

        return redirect()->route('customer.cart.index')->with('success', 'Cart updated.');
    }

    // ─────────────────────────────────────────────────────────────
    // REMOVE
    // ─────────────────────────────────────────────────────────────
    public function remove(Request $request)
    {
        $validated = $request->validate([
            'cart_id' => 'required|exists:carts,id',
        ]);

        $cartItem = $this->getCartItem($validated['cart_id']);
        if ($cartItem) {
            $cartItem->delete();
        }

        return redirect()->route('customer.cart.index')->with('success', 'Item removed.');
    }

    // ─────────────────────────────────────────────────────────────
    // QUICK ADD — from product card
    // ─────────────────────────────────────────────────────────────


        /**
     * QUICK ADD
     * Same logic as add() but without the manual JSON parsing — used when
     * clicking "Add to cart" from a product card. Validates, checks stock,
     * then either increments an existing matching cart row or creates a new one.
     */
    public function quickAdd(Request $request)
    {
        $validated = $request->validate([
            'product_id'    => 'required|exists:products,id',
            'quantity'      => 'required|integer|min:1',
            'customization' => 'nullable|array',
            'variant_id'    => 'nullable|exists:product_variants,id',
        ]);

        $product = Product::find($validated['product_id']);

        if ($product->stock_quantity < $validated['quantity']) {
            return back()->withErrors(['quantity' => 'Not enough stock.']);
        }

        $userId        = Auth::id();
        $sessionId     = session()->getId();
        $customization = $validated['customization'] ?? [];
        $variantId     = $validated['variant_id'] ?? null;

        $cartItem = Cart::where('product_id', $validated['product_id'])
            ->where('customization_data', json_encode($customization))
            ->where('variant_id', $variantId)
            ->when($userId, function ($query) use ($userId) {
                return $query->where('user_id', $userId);
            }, function ($query) use ($sessionId) {
                return $query->where('session_id', $sessionId);
            })
            ->first();

        if ($cartItem) {
            $cartItem->quantity += $validated['quantity'];

            $pricing = $this->computePricing($product, $customization, $cartItem->quantity);
            $cartItem->customization_surcharge = $pricing['surcharge'];
            $cartItem->customization_breakdown = $pricing['breakdown'];

            $cartItem->save();
        } else {
            $pricing = $this->computePricing($product, $customization, $validated['quantity']);

            Cart::create([
                'user_id'                 => $userId,
                'session_id'              => $userId ? null : $sessionId,
                'product_id'              => $validated['product_id'],
                'variant_id'              => $variantId,
                'quantity'                => $validated['quantity'],
                'customization_data'      => $customization,
                'customization_surcharge' => $pricing['surcharge'],
                'customization_breakdown' => $pricing['breakdown'],
            ]);
        }

        return back()->with('success', 'Product added to cart!');
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

        /**
     * GET CURRENT CART ITEMS
     * Returns all cart rows for the current user, or (for guests) the current
     * session. Only includes items whose product still exists.
     */
    private function getCartItems()
    {
        $userId    = Auth::id();
        $sessionId = session()->getId();

        $query = Cart::with(['product', 'variant.images'])
            ->whereHas('product')
            ->when($userId, function ($query) use ($userId) {
                return $query->where('user_id', $userId);
            }, function ($query) use ($sessionId) {
                return $query->where('session_id', $sessionId);
            });

        return $query->get();
    }

    private function getCartItem($id)
    {
        $userId    = Auth::id();
        $sessionId = session()->getId();

        return Cart::where('id', $id)
            ->when($userId, function ($q) use ($userId) {
                return $q->where('user_id', $userId);
            }, function ($q) use ($sessionId) {
                return $q->where('session_id', $sessionId);
            })
            ->first();
    }

    /**
     * Compute pricing (surcharge + breakdown snapshot) for a product.
     */



        /**
     * COMPUTE PRICING
     * Central pricing routine — returns ['surcharge' => float, 'breakdown' => array|null].
     *
     * Non-customizable products → zero surcharge, no breakdown.
     * Customizable products:
     *   1. Get the dimension surcharge from CustomizationPricingService
     *      (which uses MaterialCalculationService under the hood).
     *   2. Add the finish surcharge (product.standard_finish_surcharge)
     *      when finish_option === 'standard'.
     *   3. Add design surcharges for any non-default design picked per part.
     *   4. Merge everything into a breakdown snapshot that gets stored on the
     *      cart row and later copied to the order item.
     *
     * Any exception → log + fall back to zero surcharge so adding to cart
     * never hard-fails on a pricing bug.
     */
    private function computePricing(Product $product, array $customization, int $quantity): array
    {
        if (!$product->is_customizable) {
            return ['surcharge' => 0.0, 'breakdown' => null];
        }

        $partsData = !empty($customization['parts'])
            ? $customization['parts']
            : $customization;

        try {
            // 1. Get dimension surcharge from the service
            $result = $this->pricingService->calculateSurcharge($product, $partsData, $quantity);
            $baseSurcharge = (float) ($result['surcharge'] ?? 0);

            // 2. Calculate Finish Surcharge
            $finishOption = $customization['finish_option'] ?? 'ordinary';
            $finishSurcharge = 0;
            if ($finishOption === 'standard') {
                $finishSurcharge = (float) ($product->standard_finish_surcharge ?? 0);
            }

            // 3. Calculate Design Surcharge
            $designSurcharge = 0;
            if (is_array($partsData)) {
                foreach ($partsData as $partId => $data) {
                    if (isset($data['design_id'])) {
                        $part = $product->parts->firstWhere('id', $partId);
                        if ($part) {
                            $design = $part->designs->firstWhere('id', $data['design_id']);
                            if ($design && !$design->is_default) {
                                $designSurcharge += (float) $design->additional_cost;
                            }
                        }
                    }
                }
            }

            // Combine everything
            $totalSurcharge = $baseSurcharge + $finishSurcharge + $designSurcharge;

            return [
                'surcharge' => $totalSurcharge,
                'breakdown' => [
                    'rows'                    => $result['breakdown'] ?? [],
                    'standard_dimensions'     => $result['standard_dimensions'] ?? null,
                    'markup_percent'          => $result['markup_percent'] ?? 0,
                    'material_cost_standard'  => $result['material_cost_standard'] ?? 0,
                    'material_cost_custom'    => $result['material_cost_custom'] ?? 0,
                    'material_cost_diff'      => $result['material_cost_diff'] ?? 0,
                    'finish_surcharge'        => $finishSurcharge,
                    'design_surcharge'        => $designSurcharge,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('[CART PRICING] Failed', [
                'product_id' => $product->id,
                'error' => $e->getMessage(),
            ]);
            return ['surcharge' => 0.0, 'breakdown' => null];
        }
    }




    private function authorizeCartItem(Cart $cart): void
{
    $userId = Auth::id();

    if ($cart->user_id !== null) {
        abort_unless((int) $cart->user_id === (int) $userId, 403);
    } else {
        abort_unless($cart->session_id === session()->getId(), 403);
    }
}

private function unitProps(): array
{
    return [
        'dimension'      => config('units.dimension'),
        'dimensionShort' => config('units.dimension_short'),
        'dimensionLabel' => config('units.dimension_label'),
    ];
}
}




