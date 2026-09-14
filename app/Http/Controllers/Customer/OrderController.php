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
    $orders = Order::with(['items.product.images'])
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

           // ✅ Load user, items, payments
    $order->load(['user', 'items.product.images', 'payments']);


        // Add finish name and load parts for each order item
        foreach ($order->items as $item) {
            $item->load('product.parts');
            if (isset($item->customization_data['finish_id'])) {
                $finish = Material::find($item->customization_data['finish_id']);
                $item->finish_name = $finish ? $finish->name : null;
            }
        }

        return Inertia::render('Customer/Orders/Show', ['order' => $order]);
    }
}
