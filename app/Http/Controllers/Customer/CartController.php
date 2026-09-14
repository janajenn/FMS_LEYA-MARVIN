<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use App\Models\Material; // ✅ Add this import
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
   public function index()
{
    $cartItems = $this->getCartItems();
    $cartItems->load('product.images');

    $cartItems = $cartItems->filter(function ($item) {
        return $item->product !== null;
    });

    foreach ($cartItems as $item) {
        if (isset($item->customization_data['finish_id'])) {
            $finish = Material::find($item->customization_data['finish_id']);
            $item->finish_name = $finish ? $finish->name : null;
        }
    }

    $total = $cartItems->sum(function ($item) {
        return $item->product->price * $item->quantity;
    });

    // ✅ DEBUG: This will dump the data and stop execution

    // The rest is NOT reached because of dd()
    return Inertia::render('Customer/Cart/CartIndex', [
        'cartItems' => $cartItems->values()->toArray(),
        'total' => $total,
    ]);
}





     public function store(Request $request)
    {
        // 1. Get selected IDs from request (can be array or comma string)
        $selectedIds = $request->input('selected_ids', []);
        if (is_string($selectedIds)) {
            $selectedIds = explode(',', $selectedIds);
        }

        // 2. Retrieve all cart items and filter by selected IDs
        $cartItems = $this->getCartItems();
        $cartItems->load('product');

        if (!empty($selectedIds)) {
            $cartItems = $cartItems->filter(function ($item) use ($selectedIds) {
                return in_array($item->id, $selectedIds);
            });
        }

        // 3. If no items left, return error
        if ($cartItems->isEmpty()) {
            return back()->withErrors('No items selected for purchase.');
        }

        // 4. Validate stock for all selected items
        foreach ($cartItems as $item) {
            if ($item->product->stock_quantity < $item->quantity) {
                return back()->withErrors([
                    'stock' => "Not enough stock for {$item->product->name}."
                ]);
            }
        }

        // 5. Build order (example – adapt to your own Order model)
        //    Create an order record, attach items, etc.
        $order = \App\Models\Order::create([
            'user_id' => Auth::id(),
            'session_id' => Auth::id() ? null : session()->getId(),
            'total' => $cartItems->sum(fn($i) => $i->product->price * $i->quantity),
            'status' => 'pending',
        ]);

        // Attach order items (simplified)
        foreach ($cartItems as $item) {
            $order->items()->create([
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'price' => $item->product->price,
                'customization_data' => $item->customization_data,
            ]);
        }

        // 6. Reduce product stock
        foreach ($cartItems as $item) {
            $product = $item->product;
            $product->stock_quantity -= $item->quantity;
            $product->save();
        }

        // 7. Delete purchased items from cart
        foreach ($cartItems as $item) {
            $item->delete();
        }

        // 8. Redirect to orders page with success message
        return redirect()->route('customer.orders.index')
            ->with('success', 'Order placed successfully!');
    }




public function add(Request $request)
{
    // 1. Get raw payload
    $rawContent = $request->getContent();
    \Log::info('Raw request content:', ['raw' => $rawContent]);

    // 2. Try to decode JSON
    $data = json_decode($rawContent, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
        \Log::info('Decoded JSON payload:', $data);
    } else {
        // Fallback to standard input (for form data)
        $data = $request->all();
        \Log::info('Fallback to $request->all():', $data);
    }

    // 3. Validate the data
    $validator = validator($data, [
        'product_id' => 'required|exists:products,id',
        'quantity' => 'required|integer|min:1',
        'customization' => 'nullable',
    ]);

    if ($validator->fails()) {
        \Log::error('Validation failed:', $validator->errors()->toArray());
        return back()->withErrors($validator->errors())->withInput();
    }

    $validated = $validator->validated();

    // 4. Check stock
    $product = Product::find($validated['product_id']);
    if ($product->stock_quantity < $validated['quantity']) {
        \Log::warning('Not enough stock', ['product_id' => $product->id]);
        return back()->withErrors(['quantity' => 'Not enough stock.']);
    }

    // 5. Build cart item lookup
    $userId = Auth::id();
    $sessionId = session()->getId();
    $customization = $validated['customization'] ?? [];
    // Ensure customization is an array (convert object if needed)
    if (is_object($customization)) {
        $customization = (array) $customization;
    }
    $customizationJson = json_encode($customization);

    $cartItem = Cart::where('product_id', $validated['product_id'])
        ->where('customization_data', $customizationJson)
        ->when($userId, function ($query) use ($userId) {
            return $query->where('user_id', $userId);
        }, function ($query) use ($sessionId) {
            return $query->where('session_id', $sessionId);
        })
        ->first();

    // 6. Create or update
    if ($cartItem) {
        $cartItem->quantity += $validated['quantity'];
        $cartItem->save();
        \Log::info('Updated existing cart item', ['cart_id' => $cartItem->id, 'new_quantity' => $cartItem->quantity]);
    } else {
        Cart::create([
            'user_id' => $userId,
            'session_id' => $userId ? null : $sessionId,
            'product_id' => $validated['product_id'],
            'quantity' => $validated['quantity'],
            'customization_data' => $customization,
        ]);
        \Log::info('Created new cart item');
    }

    // 7. Redirect back with success message
    return redirect()->back()->with('success', 'Product added to cart!');
}




    public function update(Request $request)
    {
        $validated = $request->validate([
            'cart_id' => 'required|exists:carts,id',
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
            $cartItem->save();
        }

        // ✅ Fixed
        return redirect()->route('customer.cart.index')->with('success', 'Cart updated.');
    }

    public function remove(Request $request)
    {
        $validated = $request->validate([
            'cart_id' => 'required|exists:carts,id',
        ]);

        $cartItem = $this->getCartItem($validated['cart_id']);
        if ($cartItem) {
            $cartItem->delete();
        }

        // ✅ Fixed
        return redirect()->route('customer.cart.index')->with('success', 'Item removed.');
    }

    private function getCartItems()
    {
        $userId = Auth::id();
        $sessionId = session()->getId();

        $query = Cart::with('product')
            ->whereHas('product') // ensure product exists
            ->when($userId, function ($query) use ($userId) {
                return $query->where('user_id', $userId);
            }, function ($query) use ($sessionId) {
                return $query->where('session_id', $sessionId);
            });

        return $query->get();
    }



    private function getCartItem($id)
    {
        $userId = Auth::id();
        $sessionId = session()->getId();

        return Cart::where('id', $id)
            ->when($userId, function ($q) use ($userId) {
                return $q->where('user_id', $userId);
            }, function ($q) use ($sessionId) {
                return $q->where('session_id', $sessionId);
            })
            ->first();
    }


    public function quickAdd(Request $request)
{
    $validated = $request->validate([
        'product_id' => 'required|exists:products,id',
        'quantity' => 'required|integer|min:1',
        'customization' => 'nullable|array',
    ]);

    $product = Product::find($validated['product_id']);

    if ($product->stock_quantity < $validated['quantity']) {
        return back()->withErrors(['quantity' => 'Not enough stock.']);
    }

    $userId = Auth::id();
    $sessionId = session()->getId();

    $cartItem = Cart::where('product_id', $validated['product_id'])
        ->where('customization_data', json_encode($validated['customization'] ?? []))
        ->when($userId, function ($query) use ($userId) {
            return $query->where('user_id', $userId);
        }, function ($query) use ($sessionId) {
            return $query->where('session_id', $sessionId);
        })
        ->first();

    if ($cartItem) {
        $cartItem->quantity += $validated['quantity'];
        $cartItem->save();
    } else {
        Cart::create([
            'user_id' => $userId,
            'session_id' => $userId ? null : $sessionId,
            'product_id' => $validated['product_id'],
            'quantity' => $validated['quantity'],
            'customization_data' => $validated['customization'] ?? [],
        ]);
    }

    return back()->with('success', 'Product added to cart!');
}
}
