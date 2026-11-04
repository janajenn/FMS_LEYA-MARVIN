<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ShopController;

/*
|--------------------------------------------------------------------------
| API v1 — Mobile App (Customer)
|--------------------------------------------------------------------------
| Only the Customer role uses this API. Admin/Manager/Driver continue
| to use the web (Inertia) app as before.
*/

Route::prefix('v1')->group(function () {

    // ─── Public endpoints ────────────────────────────────────
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login',    [AuthController::class, 'login']);

    Route::get('shop',             [ShopController::class, 'index']);
    Route::get('categories',       [ShopController::class, 'categories']);
    // Route::get('delivery-zones',   [ShopController::class, 'deliveryZones']);
    Route::get('delivery-zones', [\App\Http\Controllers\Api\V1\CheckoutController::class, 'zones']);
    Route::get('products/{slug}',  [ShopController::class, 'show']);

    // ─── Authenticated (Sanctum bearer token) ────────────────
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me',      [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);


         // NEW — Cart
    Route::get('cart',          [\App\Http\Controllers\Api\V1\CartController::class, 'index']);
    Route::post('cart/add',     [\App\Http\Controllers\Api\V1\CartController::class, 'add']);
    Route::put('cart/update',   [\App\Http\Controllers\Api\V1\CartController::class, 'update']);
    Route::delete('cart/remove', [\App\Http\Controllers\Api\V1\CartController::class, 'remove']);

    // ── ADD THESE TWO ──────────────────────────────────────
        Route::get('cart/{cart}',              [\App\Http\Controllers\Api\V1\CartController::class, 'show'])
            ->whereNumber('cart');
        Route::put('cart/{cart}/customization', [\App\Http\Controllers\Api\V1\CartController::class, 'updateCustomization'])
            ->whereNumber('cart');



        // PayMongo
    Route::post('checkout/paymongo', [\App\Http\Controllers\Api\V1\CheckoutController::class, 'paymongo']);
    Route::post('checkout/verify',   [\App\Http\Controllers\Api\V1\CheckoutController::class, 'verify']);
    Route::get('checkout/zone-by-coordinates', [\App\Http\Controllers\Api\V1\CheckoutController::class, 'zoneByCoordinates']);

    Route::get('checkout/store-location', [\App\Http\Controllers\Api\V1\CheckoutController::class, 'storeLocation']);
Route::get('checkout/delivery-fee',   [\App\Http\Controllers\Api\V1\CheckoutController::class, 'deliveryFee']);

    Route::get('checkout/reverse-geocode', [\App\Http\Controllers\Api\V1\CheckoutController::class, 'reverseGeocode']);


            // Orders
        Route::get('orders',         [\App\Http\Controllers\Api\V1\OrderController::class, 'index']);
        Route::get('orders/{order}', [\App\Http\Controllers\Api\V1\OrderController::class, 'show']);



        // ─── Delivery Driver ───
Route::prefix('driver')->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\Api\V1\Driver\DashboardController::class, 'index']);
    Route::get('deliveries', [\App\Http\Controllers\Api\V1\Driver\DeliveryController::class, 'index']);
    Route::get('deliveries/{delivery}', [\App\Http\Controllers\Api\V1\Driver\DeliveryController::class, 'show'])->whereNumber('delivery');
    Route::post('deliveries/{delivery}/status', [\App\Http\Controllers\Api\V1\Driver\DeliveryController::class, 'updateStatus'])->whereNumber('delivery');
    Route::post('deliveries/{delivery}/collect-balance', [\App\Http\Controllers\Api\V1\Driver\DeliveryController::class, 'collectBalance'])->whereNumber('delivery');
});
    });



    // app/Http/Controllers/Api/V1/Kiosk/* (NEW namespace)
    // ────────────────────────────────────────────────────────
    // KIOSK ROUTES
    // ────────────────────────────────────────────────────────
    Route::prefix('kiosk')->middleware('kiosk')->group(function () {
        
        // We can reuse your existing public ShopController for products!
        Route::get('shop',             [\App\Http\Controllers\Api\V1\ShopController::class, 'index']);
        Route::get('categories',       [\App\Http\Controllers\Api\V1\ShopController::class, 'categories']);
        Route::get('products/{slug}',  [\App\Http\Controllers\Api\V1\ShopController::class, 'show']);

        // Kiosk Cart
        Route::get('cart',                    [\App\Http\Controllers\Api\V1\Kiosk\CartController::class, 'index']);
        Route::post('cart/add',               [\App\Http\Controllers\Api\V1\Kiosk\CartController::class, 'add']);
        Route::put('cart/update',             [\App\Http\Controllers\Api\V1\Kiosk\CartController::class, 'update']);
        Route::delete('cart/remove',          [\App\Http\Controllers\Api\V1\Kiosk\CartController::class, 'remove']);

        // Kiosk Checkout
        Route::post('checkout/cash',  [\App\Http\Controllers\Api\V1\Kiosk\CheckoutController::class, 'cash']);
        Route::post('checkout/gcash', [\App\Http\Controllers\Api\V1\Kiosk\CheckoutController::class, 'gcash']);
        Route::get('checkout/status', [\App\Http\Controllers\Api\V1\Kiosk\CheckoutController::class, 'status']);

        // Delivery Utilities (we just reuse the mobile app's controller for these!)
        Route::get('checkout/delivery-fee',        [\App\Http\Controllers\Api\V1\CheckoutController::class, 'deliveryFee']);
        Route::get('checkout/store-location',      [\App\Http\Controllers\Api\V1\CheckoutController::class, 'storeLocation']);
        Route::get('checkout/reverse-geocode',     [\App\Http\Controllers\Api\V1\CheckoutController::class, 'reverseGeocode']);
    });

    // Mobile WebView callback — the app intercepts this URL before it loads
Route::get('payment/mobile-done', function () {
    return response(
        '<!doctype html><html><head><meta charset="utf-8"><title>Payment</title>'
        . '<style>body{font-family:system-ui,sans-serif;text-align:center;padding:60px 20px;color:#1c1917}</style>'
        . '</head><body><h1>Processing…</h1><p>You can close this window and return to the app.</p></body></html>'
    )->header('Content-Type', 'text/html');
});
});
