<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Order;
use App\Models\Payment;
use App\Events\Payment\PaymentReceived;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderCreationService
{
    protected OrderMaterialService $materialService;

    public function __construct(?OrderMaterialService $materialService = null)
    {
        $this->materialService = $materialService ?? new OrderMaterialService();
    }

    /**
     * Create an order from cart items.
     *
     * @param \Illuminate\Support\Collection $cartItems
     * @param array $meta
     * @return Order
     */
    public function createFromCartItems($cartItems, array $meta): Order
    {
        $payment = null;

        $order = DB::transaction(function () use ($cartItems, $meta, &$payment) {
            // 1. Calculate Totals
            $subtotal = 0.0;
            foreach ($cartItems as $c) {
                $base      = (float) ($c->variant?->price ?? $c->product->price);
                $labor     = (float) ($c->product?->labor_cost ?? 0);
                $surcharge = (float) ($c->customization_surcharge ?? 0);
                $subtotal += ($base + $labor) * $c->quantity + $surcharge;
            }
            
            $deliveryFee = (float) ($meta['delivery_fee'] ?? 0);
            $total = round($subtotal + $deliveryFee, 2);

            // 2. Create Order
            $order = Order::create([
                'user_id'          => $meta['user_id'] ?? null,
                'source'           => $meta['source'] ?? 'web',
                'kiosk_id'         => $meta['kiosk_id'] ?? null,
                'customer_name'    => $meta['customer_name'] ?? null,
                'customer_phone'   => $meta['customer_phone'] ?? null,
                'order_number'     => Order::generateOrderNumber(),
                'total'            => $total,
                'status'           => $meta['status'] ?? 'pending',
                'payment_status'   => $meta['payment_status'] ?? 'pending',
                'shipping_address' => $meta['shipping_address'],
                'delivery_zone'    => $meta['delivery_zone'] ?? null,
                'delivery_fee'     => $deliveryFee,
                'notes'            => $meta['notes'] ?? null,
                'latitude'         => $meta['latitude'] ?? null,
                'longitude'        => $meta['longitude'] ?? null,
            ]);

            // 3. Create Order Items
            foreach ($cartItems as $c) {
                $unit = (float) ($c->variant?->price ?? $c->product->price)
                      + (float) ($c->product?->labor_cost ?? 0);

                $order->items()->create([
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

            // 4. Deduct Materials
            $order->load('items');
            $this->materialService->deductForOrder($order);

            // 5. Create Payment Record (if applicable)
            if (!empty($meta['payment_type'])) {
                $payment = Payment::create([
                    'order_id'       => $order->id,
                    'amount'         => $meta['amount_to_pay'] ?? $total,
                    'method'         => $meta['payment_method'] ?? 'paymongo',
                    'status'         => 'paid',
                    'type'           => $meta['payment_type'],
                    'transaction_id' => $meta['transaction_id'] ?? null,
                    'paid_at'        => now(),
                ]);
            }

            // 6. Clear Cart (by IDs to ensure we only clear what was checked out)
            Cart::whereIn('id', $cartItems->pluck('id'))->delete();

            return $order;
        });

        // Dispatch event AFTER transaction commits successfully
        if ($payment) {
            PaymentReceived::dispatch($payment);
        }

        return $order;
    }
}