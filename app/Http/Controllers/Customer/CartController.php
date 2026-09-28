<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use App\Models\Material;
use App\Services\CustomizationPricingService;
use App\Services\MaterialCalculationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    protected CustomizationPricingService $pricingService;

    public function __construct()
    {
        $this->pricingService = new CustomizationPricingService(
            new MaterialCalculationService()
        );
    }

    // ─────────────────────────────────────────────────────────────
    // INDEX — shows cart + total (reads stored breakdown JSON)
    // ─────────────────────────────────────────────────────────────
   public function index()
{
    $cartItems = $this->getCartItems();

    // Eager-load product images AND variant images
    $cartItems->load(['product.images', 'variant.images']);

    $cartItems = $cartItems->filter(fn ($item) => $item->product !== null);

    foreach ($cartItems as $item) {
        // Finish name
        if (isset($item->customization_data['finish_id'])) {
            $finish = Material::find($item->customization_data['finish_id']);
            $item->finish_name = $finish ? $finish->name : null;
        }

        // Stored breakdown
        $stored = $item->customization_breakdown;
        $item->customization_breakdown = $stored['rows'] ?? null;
        $item->standard_dimensions     = $stored['standard_dimensions'] ?? null;
        $item->markup_percent          = $stored['markup_percent'] ?? null;
        $item->material_cost_diff      = $stored['material_cost_diff'] ?? null;

        // ────────────────────────────────────────────────
        // ✅ LABOR-INCLUSIVE FINAL PRICE
        //    final = (variant price OR product price) + labor_cost
        // ────────────────────────────────────────────────
        $productBasePrice = (float) ($item->variant?->price ?? $item->product->price);
        $laborCost        = (float) ($item->product->labor_cost ?? 0);
        $finalUnitPrice   = $productBasePrice + $laborCost;

        // Expose to frontend
        $item->base_price     = $finalUnitPrice;        // used for line total + display
        $item->variant_name   = $item->variant?->name;
        $item->variant_slug   = $item->variant?->slug;
        $item->variant_images = $item->variant?->images ?? [];

        // Fallback chain for display image: variant → gallery
        $item->display_image_path = $item->variant?->primary_image
            ?? $item->product->images->first()?->path
            ?? null;
    }

    // ── Cart total — final unit × qty + surcharge ──
    $total = $cartItems->sum(function ($item) {
        $unit = (float) ($item->variant?->price ?? $item->product->price)
              + (float) ($item->product->labor_cost ?? 0);
        $surcharge = (float) ($item->customization_surcharge ?? 0);
        return $unit * $item->quantity + $surcharge;
    });

    return Inertia::render('Customer/Cart/CartIndex', [
        'cartItems' => $cartItems->values()->toArray(),
        'total'     => (float) $total,
    ]);
}



    // ─────────────────────────────────────────────────────────────
    // STORE — legacy direct-order creation (no PayMongo)
    // ─────────────────────────────────────────────────────────────
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

        // 3. Validate stock
        foreach ($cartItems as $item) {
            if ($item->product->stock_quantity < $item->quantity) {
                return back()->withErrors([
                    'stock' => "Not enough stock for {$item->product->name}.",
                ]);
            }
        }

        // 4. Compute totals — ✅ includes labor cost
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

        DB::transaction(function () use (
            $cartItems,
            $total,
            $deliveryFee,
            $subtotal,
            $customizationSurcharge,
            &$order
        ) {
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

            // ✅ Order items — price includes labor; labor_cost still snapshotted separately
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
                ]);
            }

            // Reduce product stock
            foreach ($cartItems as $item) {
                $product = $item->product;
                $product->stock_quantity -= $item->quantity;
                $product->save();
            }

            // Delete purchased items
            $cartItemIds = $cartItems->pluck('id')->toArray();
            Cart::whereIn('id', $cartItemIds)
                ->where('user_id', Auth::id())
                ->delete();
        });

        return redirect()->route('customer.orders.index')
            ->with('success', 'Order placed successfully!');
    }

    // ─────────────────────────────────────────────────────────────
    // ADD — main entry point from product page
    // ─────────────────────────────────────────────────────────────
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
    private function computePricing(Product $product, array $customization, int $quantity): array
    {
        if (!$product->is_customizable) {
            return ['surcharge' => 0.0, 'breakdown' => null];
        }

        $partsData = !empty($customization['parts'])
            ? $customization['parts']
            : $customization;

        try {
            $result = $this->pricingService->calculateSurcharge(
                $product,
                $partsData,
                $quantity
            );

            Log::info('[CART PRICING] Computed', [
                'product_id' => $product->id,
                'quantity'   => $quantity,
                'surcharge'  => $result['surcharge'],
                'reason'     => $result['reason'],
            ]);

            return [
                'surcharge' => (float) $result['surcharge'],
                'breakdown' => [
                    'rows'                    => $result['breakdown'] ?? [],
                    'standard_dimensions'     => $result['standard_dimensions'] ?? null,
                    'markup_percent'          => $result['markup_percent'] ?? 0,
                    'material_cost_standard'  => $result['material_cost_standard'] ?? 0,
                    'material_cost_custom'    => $result['material_cost_custom'] ?? 0,
                    'material_cost_diff'      => $result['material_cost_diff'] ?? 0,
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
}
