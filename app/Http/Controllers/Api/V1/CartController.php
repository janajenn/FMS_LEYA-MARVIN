<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * List all cart items for the authenticated user.
     */
    public function index(Request $request)
    {
        $items = Cart::with(['product.images', 'variant.images'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data'       => $items->map(fn ($item) => $this->transform($item)),
            'cart_count' => (int) $items->sum('quantity'),
        ]);
    }

    /**
     * Add a product (optionally with variant + customization) to the cart.
     */
    public function add(Request $request)
    {
        $validated = $request->validate([
            'product_id'    => 'required|exists:products,id',
            'quantity'      => 'required|integer|min:1',
            'variant_id'    => 'nullable|exists:product_variants,id',
            'customization' => 'nullable|array',
        ]);

        $userId = $request->user()->id;

        // Merge with an existing identical line:
        //   same product + same variant + same customization
        $customization = !empty($validated['customization'])
            ? $validated['customization']
            : null;

        $existing = Cart::where('user_id', $userId)
            ->where('product_id', $validated['product_id'])
            ->where('variant_id', $validated['variant_id'] ?? null)
            ->where(function ($q) use ($customization) {
                if ($customization === null) {
                    $q->whereNull('customization_data');
                } else {
                    $q->where('customization_data', json_encode($customization));
                }
            })
            ->first();

        if ($existing) {
            $existing->quantity += $validated['quantity'];
            $existing->save();
        } else {
            Cart::create([
                'user_id'            => $userId,
                'product_id'         => $validated['product_id'],
                'variant_id'         => $validated['variant_id'] ?? null,
                'quantity'           => $validated['quantity'],
                'customization_data' => $customization,
            ]);
        }

        $count = (int) Cart::where('user_id', $userId)->sum('quantity');

        return response()->json([
            'message'    => 'Added to cart.',
            'cart_count' => $count,
        ]);
    }

    /**
     * Update quantity for a cart line.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'cart_id'  => 'required|exists:carts,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $item = Cart::where('id', $validated['cart_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $item->quantity = $validated['quantity'];
        $item->save();

        $count = (int) Cart::where('user_id', $request->user()->id)->sum('quantity');

        return response()->json([
            'message'    => 'Quantity updated.',
            'cart_count' => $count,
        ]);
    }

    /**
     * Remove a cart line.
     */
    public function remove(Request $request)
    {
        $validated = $request->validate([
            'cart_id' => 'required|exists:carts,id',
        ]);

        Cart::where('id', $validated['cart_id'])
            ->where('user_id', $request->user()->id)
            ->delete();

        $count = (int) Cart::where('user_id', $request->user()->id)->sum('quantity');

        return response()->json([
            'message'    => 'Removed from cart.',
            'cart_count' => $count,
        ]);
    }

    /**
     * Shape a cart row for the mobile app.
     */
    private function transform(Cart $item): array
    {
        // Use the model's own accessor to get the correct base price
        $basePrice = (float) $item->base_price;
        $laborCost = (float) ($item->product?->labor_cost ?? 0);
        $surcharge = (float) ($item->customization_surcharge ?? 0);

        $lineTotal = ($basePrice + $laborCost) * $item->quantity + $surcharge;

        return [
            'id'                       => $item->id,
            'quantity'                 => (int) $item->quantity,
            'customization'            => $item->customization_data,
            'customization_surcharge'  => $surcharge,
            'customization_breakdown'  => $item->customization_breakdown,
            'line_total'               => round($lineTotal, 2),
            'product' => $item->product ? [
                'id'         => $item->product->id,
                'name'       => $item->product->name,
                'slug'       => $item->product->slug,
                'price'      => (float) $item->product->price,
                'labor_cost' => $laborCost,
                'image_url'  => $item->product->images?->first()
                    ? asset('storage/' . $item->product->images->first()->path)
                    : null,
            ] : null,
                        'variant' => $item->variant ? [
                'id'        => $item->variant->id,
                'name'      => $item->variant->name,
                'slug'      => $item->variant->slug,
                'price'     => (float) $item->variant->price,
                'image_url' => $item->variant->images?->first()
                    ? asset('storage/' . $item->variant->images->first()->path)
                    : null,
            ] : null,
        ];
    }
}
