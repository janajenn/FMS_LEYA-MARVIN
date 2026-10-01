<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * List orders for the authenticated customer.
     */
    public function index(Request $request)
    {
        $orders = Order::with([
                'items.product.images',
                'items.variant.images',
                'payments',
            ])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $orders->map(fn ($o) => $this->transform($o, false)),
        ]);
    }

    /**
     * Single order — includes full item customization + delivery info.
     */
      public function show(Request $request, Order $order)
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $order->load([
            'items.product.images',
            'items.product.parts',
            'items.variant.images',
            'payments',
            'delivery',
        ]);

        return response()->json([
            'data'           => $this->transform($order, true),
            'store_location' => $this->storeLocation(),
        ]);
    }

    /**
     * Store coordinates for the delivery route map.
     */
    private function storeLocation(): array
    {
        return [
            'name'      => config('store.name', 'FMS Store'),
            'address'   => config('store.address', ''),
            'latitude'  => (float) config('store.latitude', 0),
            'longitude' => (float) config('store.longitude', 0),
        ];
    }

    /* ─────────────── Shape ─────────────── */

    private function transform(Order $order, bool $detailed): array
    {
        $payload = [
            'id'                => $order->id,
            'order_number'      => $order->order_number,
            'status'            => $order->status,
            'payment_status'    => $order->payment_status,
            'total'             => (float) $order->total,
            'delivery_fee'      => (float) $order->delivery_fee,
            'delivery_zone'     => $order->delivery_zone,
            'shipping_address'  => $order->shipping_address,
            'notes'             => $order->notes,
            'latitude'          => $order->latitude !== null ? (float) $order->latitude : null,
            'longitude'         => $order->longitude !== null ? (float) $order->longitude : null,
            'production_stage'  => $order->production_stage,
            'created_at'        => optional($order->created_at)->toIso8601String(),
            'items_count'       => $order->items->count(),
        ];

        // Preview image from the first item
        $firstItem = $order->items->first();
        $payload['preview_image'] = null;
        if ($firstItem) {
            $payload['preview_image'] = $firstItem->variant?->images?->first()
                ? asset('storage/' . $firstItem->variant->images->first()->path)
                : ($firstItem->product?->images?->first()
                    ? asset('storage/' . $firstItem->product->images->first()->path)
                    : null);
        }

        if ($detailed) {
            $payload['items'] = $order->items->map(function ($item) {
                // Resolve finish name from customization_data if present
                $finishName = null;
                if (is_array($item->customization_data)
                    && !empty($item->customization_data['finish_id'])) {
                    $finish = Material::find($item->customization_data['finish_id']);
                    $finishName = $finish?->name;
                }

                // Image: variant > product
                $imageUrl = null;
                if ($item->variant?->images?->first()) {
                    $imageUrl = asset('storage/' . $item->variant->images->first()->path);
                } elseif ($item->product?->images?->first()) {
                    $imageUrl = asset('storage/' . $item->product->images->first()->path);
                }

                return [
                    'id'                      => $item->id,
                    'product_name'            => $item->product?->name,
                    'variant_name'            => $item->variant?->name,
                    'variant_slug'            => $item->variant?->slug,
                    'quantity'                => (int) $item->quantity,
                    'price'                   => (float) $item->price,
                    'line_total'              => (float) $item->price * (int) $item->quantity,
                    'image_url'               => $imageUrl,
                    'finish_name'             => $finishName,
                    'customization_data'      => $item->customization_data,
                    'customization_surcharge' => (float) ($item->customization_surcharge ?? 0),
                ];
            });

            $payload['payments'] = $order->payments->map(fn ($p) => [
                'id'         => $p->id,
                'amount'     => (float) $p->amount,
                'method'     => $p->method,
                'status'     => $p->status,
                'type'       => $p->type,
                'paid_at'    => optional($p->paid_at)->toIso8601String(),
                'created_at' => optional($p->created_at)->toIso8601String(),
            ]);

            $payload['delivery'] = $order->delivery ? [
                'id'             => $order->delivery->id,
                'status'         => $order->delivery->status,
                'tracking_number'=> $order->delivery->tracking_number ?? null,
                'driver_name'    => $order->delivery->driver?->name,
            ] : null;
        }

        return $payload;
    }
}
