<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
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
            'delivery.tier',
            'delivery.driver',
        ]);

        return response()->json([
            'data'              => $this->transform($order, true),
            'store_location'    => $this->storeLocation(),
            'production_stages' => $this->productionStages(),
        ]);
    }

    private function storeLocation(): array
    {
        return [
            'name'      => config('store.name', 'FMS Store'),
            'address'   => config('store.address', ''),
            'latitude'  => (float) config('store.latitude', 0),
            'longitude' => (float) config('store.longitude', 0),
        ];
    }

    private function productionStages(): array
    {
        return config('production_stages', [
            ['key' => 'carpentry',    'label' => 'Carpentry'],
            ['key' => 'wood_filling', 'label' => 'Wood Filling'],
            ['key' => 'sanding',      'label' => 'Sanding'],
            ['key' => 'varnishing',   'label' => 'Varnishing'],
        ]);
    }

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
                $finishName = null;
                if (is_array($item->customization_data)
                    && !empty($item->customization_data['finish_id'])) {
                    $finish = Material::find($item->customization_data['finish_id']);
                    $finishName = $finish?->name;
                }

                $imageUrl = null;
                if ($item->variant?->images?->first()) {
                    $imageUrl = asset('storage/' . $item->variant->images->first()->path);
                } elseif ($item->product?->images?->first()) {
                    $imageUrl = asset('storage/' . $item->product->images->first()->path);
                }

                // Product parts (for custom dimensions display)
                $productParts = [];
                if ($item->product && $item->product->relationLoaded('parts')) {
                    $productParts = $item->product->parts->map(fn ($p) => [
                        'id'                 => $p->id,
                        'name'               => $p->name,
                        'dimension_fields'   => $p->dimension_fields ?? [],
                        'standard_length'    => $p->standard_length    !== null ? (float) $p->standard_length    : null,
                        'standard_width'     => $p->standard_width     !== null ? (float) $p->standard_width     : null,
                        'standard_height'    => $p->standard_height    !== null ? (float) $p->standard_height    : null,
                        'standard_thickness' => $p->standard_thickness !== null ? (float) $p->standard_thickness : null,
                        'standard_diameter'  => $p->standard_diameter  !== null ? (float) $p->standard_diameter  : null,
                        'standard_depth'     => $p->standard_depth     !== null ? (float) $p->standard_depth     : null,
                    ])->values()->all();
                }

                return [
                    'id'                      => $item->id,
                    'product_name'            => $item->product?->name,
                    'variant_name'            => $item->variant?->name,
                    'variant_slug'            => $item->variant?->slug,
                    'variant_description'     => $item->variant?->description,
                    'quantity'                => (int) $item->quantity,
                    'price'                   => (float) $item->price,
                    'line_total'              => (float) $item->price * (int) $item->quantity,
                    'image_url'               => $imageUrl,
                    'finish_name'             => $finishName,
                    'customization_data'      => $item->customization_data,
                    'customization_surcharge' => (float) ($item->customization_surcharge ?? 0),
                    'product_parts'           => $productParts,
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
                'id'              => $order->delivery->id,
                'status'          => $order->delivery->status,
                'tracking_number' => $order->delivery->tracking_number ?? null,
                'driver_name'     => $order->delivery->driver?->name,
                'distance_km'     => isset($order->delivery->distance_km)
                    ? (float) $order->delivery->distance_km
                    : null,
                'estimated_days'  => isset($order->delivery->estimated_days)
                    ? (int) $order->delivery->estimated_days
                    : null,
                'tier' => $order->delivery->relationLoaded('tier') && $order->delivery->tier
                    ? [
                        'id'    => $order->delivery->tier->id,
                        'label' => $order->delivery->tier->label
                            ?? $order->delivery->tier->name
                            ?? null,
                        'fee'   => (float) ($order->delivery->tier->fee ?? 0),
                    ]
                    : null,
            ] : null;
        }

        return $payload;
    }
}
