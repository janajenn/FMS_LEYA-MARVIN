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



        // PayMongo
    Route::post('checkout/paymongo', [\App\Http\Controllers\Api\V1\CheckoutController::class, 'paymongo']);
    Route::post('checkout/verify',   [\App\Http\Controllers\Api\V1\CheckoutController::class, 'verify']);
    Route::get('checkout/zone-by-coordinates', [\App\Http\Controllers\Api\V1\CheckoutController::class, 'zoneByCoordinates']);

    Route::get('checkout/reverse-geocode', [\App\Http\Controllers\Api\V1\CheckoutController::class, 'reverseGeocode']);


            // Orders
        Route::get('orders',         [\App\Http\Controllers\Api\V1\OrderController::class, 'index']);
        Route::get('orders/{order}', [\App\Http\Controllers\Api\V1\OrderController::class, 'show']);
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
