<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Material;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with(['items.product.images', 'items.variant.images'])   // ← add
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                $order->total = (float) $order->total;
                return $order;
            });

        return Inertia::render('Customer/Orders/Index', ['orders' => $orders]);
    }

    public function show(Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        // ✅ Eager-load delivery + variant
        $order->load([
            'user',
            'items.product.images',
            'items.variant.images',    // ← add
            'payments',
            'delivery',
        ]);

        foreach ($order->items as $item) {
            $item->load('product.parts');

            if (isset($item->customization_data['finish_id'])) {
                $finish = Material::find($item->customization_data['finish_id']);
                $item->finish_name = $finish ? $finish->name : null;
            }

            // ── Expose display image + variant label for the frontend ──
            $item->variant_name = $item->variant?->name;
            $item->variant_slug = $item->variant?->slug;
            $item->display_image_path = $item->variant?->primary_image
                ?? $item->product->images->first()?->path
                ?? null;
        }

        $storeLocation = [
            'name'      => config('store.name', 'FMS Store'),
            'address'   => config('store.address', ''),
            'latitude'  => (float) config('store.latitude', 0),
            'longitude' => (float) config('store.longitude', 0),
        ];

        return Inertia::render('Customer/Orders/Show', [
            'order'         => $order,
            'storeLocation' => $storeLocation,
            'delivery'      => $order->delivery,
        ]);
    }
}
