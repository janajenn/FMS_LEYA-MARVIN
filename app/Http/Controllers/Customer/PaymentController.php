<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Services\OrderMaterialService;
use App\Services\MaterialCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cookie;

class PaymentController extends Controller
{
    /**
     * Handle successful payment redirect from PayMongo.
     */
    public function success(Request $request)
{
    // Get session ID from session or cookie
    $checkoutSessionId = session('paymongo_checkout_session_id')
        ?? $request->cookie('paymongo_checkout_session_id');

    if (!$checkoutSessionId) {
        Log::error('Payment success: No valid session ID found', [
            'session' => session()->all(),
            'cookie' => $request->cookie(),
        ]);
        return redirect()->route('customer.cart.index')
            ->with('error', 'Invalid payment session.');
    }

    Log::info('Payment success callback received', ['session_id' => $checkoutSessionId]);

    // Prevent duplicate processing
    if (Payment::where('transaction_id', $checkoutSessionId)->exists()) {
        session()->forget('paymongo_checkout_session_id');
        session()->forget('paymongo_checkout_metadata');
        return redirect()->route('customer.orders.index')
            ->with('success', 'Your order has been placed successfully.');
    }

    // Retrieve metadata from session
    $metadata = session('paymongo_checkout_metadata', []);
    if (empty($metadata)) {
        Log::error('Payment success: No metadata found in session');
        return redirect()->route('customer.cart.index')
            ->with('error', 'Invalid order data.');
    }

   $selectedIds = isset($metadata['selected_ids']) && $metadata['selected_ids'] !== ''
    ? explode(',', $metadata['selected_ids'])
    : [];



    $cartItems = $this->getCartItems($selectedIds);

    if ($cartItems->isEmpty()) {
        return redirect()->route('customer.cart.index')
            ->with('error', 'Your cart is empty.');
    }

    $subtotal = $cartItems->sum(function ($item) {
        return $item->product->price * $item->quantity;
    });
    $deliveryFee = 100;
    $total = $subtotal + $deliveryFee;

    $paymentMethod = $metadata['payment_method'] ?? 'cash_on_delivery';
    $paymentType = $metadata['payment_type'] ?? 'down_payment';
    $paymentAmount = ($paymentType === 'down_payment') ? $total * 0.5 : $total;

    $materialService = new OrderMaterialService(new MaterialCalculationService());

    DB::transaction(function () use (
        $cartItems,
        $total,
        $deliveryFee,
        $paymentAmount,
        $paymentMethod,
        $paymentType,
        $metadata,
        $materialService,
        $checkoutSessionId
    ) {
        // ✅ CORRECT STATUSES
        $order = Order::create([
            'user_id' => Auth::id(),
            'order_number' => Order::generateOrderNumber(),
            'total' => $total,
           'status' => 'accepted', // changed from 'pending'
            'payment_status' => ($paymentType === 'full_payment') ? 'paid' : 'partially_paid',
            'shipping_address' => $metadata['shipping_address'] ?? '',
            'delivery_zone' => $metadata['delivery_zone'] ?? null,
            'delivery_fee' => $deliveryFee,
            'notes' => $metadata['notes'] ?? null,
        ]);

       foreach ($cartItems as $cartItem) {
    $orderItem = OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $cartItem->product_id,
        'quantity' => $cartItem->quantity,
        'price' => $cartItem->product->price,
        'customization_data' => $cartItem->customization_data,
    ]);

    $product = $cartItem->product;

    Log::info('[PAYMENT_SUCCESS] Processing order item', [
        'order_item_id' => $orderItem->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'is_customizable' => $product->is_customizable,
        'has_customization' => !empty($cartItem->customization_data),
    ]);

    try {
        $materialService->processOrderItemMaterials(
            $orderItem,
            $product,
            $cartItem->customization_data ?? []
        );
        Log::info('[PAYMENT_SUCCESS] Material service completed for order item', [
            'order_item_id' => $orderItem->id,
        ]);
    } catch (\Exception $e) {
        Log::error('[PAYMENT_SUCCESS] Material service failed for order item', [
            'order_item_id' => $orderItem->id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        throw $e;
    }
}

        // Create Payment record
        Payment::create([
            'order_id' => $order->id,
            'amount' => $paymentAmount,
            'method' => 'paymongo', // Make sure your DB accepts this
            'status' => 'paid',
            'type' => $paymentType,
            'transaction_id' => $checkoutSessionId,
              'paid_at' => now(), // ✅ set this
        ]);

        // Clear cart
        $cartItemIds = $cartItems->pluck('id')->toArray();
        Cart::whereIn('id', $cartItemIds)->where('user_id', Auth::id())->delete();
    });

    // Clean up
    session()->forget('paymongo_checkout_session_id');
    session()->forget('paymongo_checkout_metadata');
    Cookie::queue(Cookie::forget('paymongo_checkout_session_id'));

    return redirect()->route('customer.orders.index')
        ->with('success', 'Payment successful! Your order has been placed.');
}



    /**
     * Handle payment cancellation.
     */
    public function cancel(Request $request)
    {
        return redirect()->route('customer.cart.index')
            ->with('info', 'You cancelled the payment. You can try again anytime.');
    }

    /**
     * Get cart items for the current user, optionally filtered by selected IDs.
     */
    private function getCartItems(array $selectedIds = [])
    {
        $userId = Auth::id();
        $query = Cart::with('product')->where('user_id', $userId);

        if (!empty($selectedIds)) {
            $query->whereIn('id', $selectedIds);
        }

        return $query->get();
    }
}
