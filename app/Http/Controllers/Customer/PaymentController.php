<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Events\Payment\PaymentReceived;
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


    // PAYMENT SUCCESS - Dinhi himoon ang order human makabayad ang customer sa PayMongo.
// Ang checkout page wala pa naghimo og order; nag-save ra kini sa cart details.
//
// 1. Kuhaon ang PayMongo session ID gikan sa session o backup cookie.
//
// 2. I-check kung na-process na ba ang payment aron malikayan ang duplicate nga order.
//
// 3. Kuhaon ang mga na-save nga order details, sama sa cart IDs, address, ug delivery fee.
//
// 4. Kuhaon pag-usab ang napiling cart items gikan sa database.
//
// 5. Kwentahon pag-usab ang total sa server aron masiguro nga sakto ang presyo.
//
// 6. Sulod sa database transaction, himoon ang order ug order items, i-deduct ang
//    raw materials, i-save ang payment, ug tangtangon ang napalit nga cart items.
//
// 7. Human ma-save ang tanan nga walay error, i-trigger ang PaymentReceived event
//    aron ma-update o ma-notify ang admin ug notification system.
//
// 8. Limpyohan ang session ug cookie, unya i-redirect ang customer sa iyang orders page.
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

        // ✅ Compute totals — variant-aware
       $subtotal = $cartItems->sum(function ($item) {
    $unitPrice = (float) ($item->variant?->price ?? $item->product->price)
               + (float) ($item->product->labor_cost ?? 0);
    return $unitPrice * $item->quantity;
});

        $customizationSurcharge = $cartItems->sum(function ($item) {
            return (float) ($item->customization_surcharge ?? 0);
        });

       // Was: $deliveryFee = 100;
if (!isset($metadata['delivery_fee'])) {
    Log::warning('[PAYMENT] delivery_fee missing from metadata — defaulting to 0', [
        'checkout_session_id' => $checkoutSessionId,
        'metadata_keys'       => array_keys($metadata),
    ]);
}
$deliveryFee = (float) ($metadata['delivery_fee'] ?? 0);

$total = $subtotal + $customizationSurcharge + $deliveryFee;

        $paymentMethod = $metadata['payment_method'] ?? 'cash_on_delivery';
        $paymentType = $metadata['payment_type'] ?? 'down_payment';
        $paymentAmount = ($paymentType === 'down_payment') ? $total * 0.5 : $total;

       $materialService = new OrderMaterialService(new \App\Services\MaterialRequirementCalculator());

        // ✅ Declare $payment outside the transaction so we can dispatch the event after commit
        $payment = null;

        DB::transaction(function () use (
            $cartItems,
            $total,
            $deliveryFee,
            $paymentAmount,
            $paymentMethod,
            $paymentType,
            $metadata,
            $materialService,
            $checkoutSessionId,
            &$payment
        ) {
            // Create order
            $order = Order::create([
                'user_id'          => Auth::id(),
                'order_number'     => Order::generateOrderNumber(),
                'total'            => $total,
                'status'           => 'accepted',
                'payment_status'   => ($paymentType === 'full_payment') ? 'paid' : 'partially_paid',
                'shipping_address' => $metadata['shipping_address'] ?? '',
                'delivery_zone'    => $metadata['delivery_zone'] ?? null,
                'delivery_fee'     => $deliveryFee,
                'notes'            => $metadata['notes'] ?? null,
                'latitude'         => $metadata['latitude'] ?? null,
                'longitude'        => $metadata['longitude'] ?? null,
            ]);

           foreach ($cartItems as $cartItem) {
    // ✅ Resolve unit price with variant AND labor cost
    $unitPrice = (float) ($cartItem->variant?->price ?? $cartItem->product->price)
               + (float) ($cartItem->product->labor_cost ?? 0);

               $breakdown        = $cartItem->customization_breakdown ?? [];
$designLabor      = (float) ($breakdown['design_labor_surcharge'] ?? 0);
$totalLabor       = (float) ($cartItem->product->labor_cost ?? 0) + $designLabor;
$defaultAssignee  = $cartItem->product->assigned_employee_id;

   $orderItem = OrderItem::create([
    'order_id'                => $order->id,
    'product_id'              => $cartItem->product_id,
    'variant_id'              => $cartItem->variant_id,
    'quantity'                => $cartItem->quantity,
    'price'                   => $unitPrice,
    'customization_surcharge' => (float) ($cartItem->customization_surcharge ?? 0),
    'customization_breakdown' => $cartItem->customization_breakdown,
    'customization_data'      => $cartItem->customization_data,
    'labor_cost'              => $totalLabor,
    'labor_status'            => $defaultAssignee ? 'assigned' : 'pending',
    'assigned_employee_id'    => $defaultAssignee,
    'assigned_by'             => $defaultAssignee ? null : null, // admin will fill on assignment
    'assigned_at'             => $defaultAssignee ? now() : null,
    'finish_option'           => $cartItem->customization_data['finish_option'] ?? 'ordinary',
    'finish_surcharge'        => (float) ($cartItem->customization_breakdown['finish_surcharge'] ?? 0),
]);
    // assigned_employee_id stays NULL until admin assigns

                $product = $cartItem->product;

                Log::info('[PAYMENT_SUCCESS] Processing order item', [
                    'order_item_id'     => $orderItem->id,
                    'product_id'        => $product->id,
                    'product_name'      => $product->name,
                    'variant_id'        => $cartItem->variant_id,
                    'unit_price'        => $unitPrice,
                    'is_customizable'   => $product->is_customizable,
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

            // ✅ Create Payment and assign to outer variable
            $payment = Payment::create([
                'order_id' => $order->id,
                'amount' => $paymentAmount,
                'method' => 'paymongo',
                'status' => 'paid',
                'type' => $paymentType,
                'transaction_id' => $checkoutSessionId,
                'paid_at' => now(),
            ]);

            // Clear cart
            $cartItemIds = $cartItems->pluck('id')->toArray();
            Cart::whereIn('id', $cartItemIds)->where('user_id', Auth::id())->delete();
        });

        // ✅ Dispatch payment notification AFTER the transaction commits
        if ($payment) {
            PaymentReceived::dispatch($payment);
        }

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
     * Variant-aware eager-load.
     */
    private function getCartItems(array $selectedIds = [])
    {
        $userId = Auth::id();
        $query = Cart::with(['product', 'variant.images'])
            ->where('user_id', $userId);

        if (!empty($selectedIds)) {
            $query->whereIn('id', $selectedIds);
        }

        return $query->get();
    }
}
