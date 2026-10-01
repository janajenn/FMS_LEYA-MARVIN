<?php

namespace App\Http\Middleware;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request)
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user(),
            ],

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],

            // Cart count for authenticated users
            'cartCount' => $request->user()
                ? \App\Models\Cart::where('user_id', $request->user()->id)->sum('quantity')
                : 0,

            // ── Units of measure — single source of truth ──
            // config/units.php defines the unit once. Every page that
            // renders a linear dimension (Product Create/Edit, Material
            // Create/Edit, Standard Sizes, Customer Shop/Show, etc.)
            // consumes this prop instead of hardcoding `in` / `inches`.
            'units' => [
                'dimension'      => config('units.dimension'),
                'dimensionShort' => config('units.dimension_short'),
                'dimensionLabel' => config('units.dimension_label'),
            ],

            // ── Production stages — single source of truth ──
            // Order::getProductionStagesMeta() defines the canonical
            // order + labels. Both Admin/Orders/Show and
            // Customer/Orders/Show consume this so they can never
            // disagree on stage order.
            'productionStages' => Order::getProductionStagesMeta(),
        ]);
    }
}
