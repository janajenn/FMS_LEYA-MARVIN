<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ==================== GUEST ROUTES ====================
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// Public shop & product details (for both guests and authenticated users)
Route::get('/shop', [App\Http\Controllers\Customer\ProductController::class, 'index'])->name('shop.index');
Route::get('/products/{slug}', [App\Http\Controllers\Customer\ProductController::class, 'show'])->name('products.show');

require __DIR__.'/auth.php'; // login, register, etc.

// ==================== AUTHENTICATED (SHARED) ROUTES ====================
Route::middleware('auth')->group(function () {
    // Shared dashboard redirect (based on role)
    Route::get('/dashboard', function () {
        $user = auth()->user();
        return match ($user->role->slug) {
            'admin'   => redirect()->route('admin.dashboard'),
            'manager' => redirect()->route('manager.dashboard'),
            'customer'=> redirect()->route('customer.dashboard'),
            'driver'  => redirect()->route('driver.dashboard'),
            default   => redirect()->route('home'),
        };
    })->name('dashboard');

    // Profile management (shared across roles)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ✅ NOTIFICATION ROUTES – Add them here
   // Notification routes

 // ✅ Shared notification routes
    Route::get('/notifications', [App\Http\Controllers\NotificationController::class, 'indexPage'])->name('notifications.index');
    Route::get('/notifications/json', [App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.json');
    Route::get('/notifications/unread-count', [App\Http\Controllers\NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    Route::post('/notifications/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
    Route::post('/notifications/mark-all-read', [App\Http\Controllers\NotificationController::class, 'markAllRead'])->name('notifications.mark-all-read');
});

// ==================== ADMIN ROUTES ====================
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');

    // Raw Materials
    Route::resource('materials', App\Http\Controllers\Admin\MaterialController::class);
    Route::get('materials/{material}/stock-history', [App\Http\Controllers\Admin\MaterialController::class, 'stockHistory'])->name('materials.stock-history');

    Route::resource('suppliers', App\Http\Controllers\Admin\SupplierController::class)->except(['show']);

    // Stock In (procurement‑generated)
Route::get('stock-in', [App\Http\Controllers\Admin\StockInController::class, 'index'])->name('stock-in.index');

// Legacy manual stock‑in (keep but hide from sidebar)
Route::get('stock-in/create', [App\Http\Controllers\Admin\StockInController::class, 'create'])->name('stock-in.create');
Route::post('stock-in', [App\Http\Controllers\Admin\StockInController::class, 'store'])->name('stock-in.store');

    // Product Categories & Products
    Route::resource('product-categories', App\Http\Controllers\Admin\ProductCategoryController::class);
    Route::resource('products', App\Http\Controllers\Admin\ProductController::class);

    // Delivery
    Route::resource('delivery-zones', App\Http\Controllers\Admin\DeliveryZoneController::class);
    Route::resource('deliveries', App\Http\Controllers\Admin\DeliveryController::class)->except(['show']);

    // Employees & Attendance
    Route::resource('employees', App\Http\Controllers\Admin\EmployeeController::class);
    Route::post('employees/{employee}/regenerate-qr', [App\Http\Controllers\Admin\EmployeeController::class, 'regenerateQR'])->name('employees.regenerate-qr');
    Route::get('attendance', [App\Http\Controllers\Admin\AttendanceController::class, 'index'])->name('attendance.index');
    Route::get('attendance/scan', [App\Http\Controllers\Admin\AttendanceController::class, 'scan'])->name('attendance.scan');
    Route::post('attendance/scan', [App\Http\Controllers\Admin\AttendanceController::class, 'processScan'])->name('attendance.process-scan');

    // Payroll
    Route::resource('payrolls', App\Http\Controllers\Admin\PayrollController::class)->except(['edit', 'update', 'destroy']);
    Route::get('payrolls/create', [App\Http\Controllers\Admin\PayrollController::class, 'create'])->name('payrolls.create');
    Route::post('payrolls/generate', [App\Http\Controllers\Admin\PayrollController::class, 'generate'])->name('payrolls.generate');
    Route::post('payrolls/{payroll}/approve', [App\Http\Controllers\Admin\PayrollController::class, 'approve'])->name('payrolls.approve');
    Route::post('payrolls/{payroll}/paid', [App\Http\Controllers\Admin\PayrollController::class, 'markPaid'])->name('payrolls.paid');

    // User Management
    Route::resource('users', App\Http\Controllers\Admin\UserManagementController::class)->except(['show']);


 // Procurement - Material Requests
Route::resource('material-requests', App\Http\Controllers\Admin\MaterialRequestController::class)->except(['edit', 'update']);
Route::get('material-requests/{materialRequest}/edit', [App\Http\Controllers\Admin\MaterialRequestController::class, 'edit'])->name('material-requests.edit');
Route::put('material-requests/{materialRequest}', [App\Http\Controllers\Admin\MaterialRequestController::class, 'update'])->name('material-requests.update');

// ✅ Replacement Request – redirects to the create form with prefill
Route::get('purchase-orders/{purchaseOrder}/replacement-request', [App\Http\Controllers\Admin\GoodsReceiptController::class, 'createReplacementRequestForm'])->name('purchase-orders.replacement-request');

// ✅ Receive Replacement – only after approval
Route::get('purchase-orders/{purchaseOrder}/receive-replacement', [App\Http\Controllers\Admin\ReplacementReceiptController::class, 'create'])->name('purchase-orders.receive-replacement');
Route::post('purchase-orders/{purchaseOrder}/receive-replacement', [App\Http\Controllers\Admin\ReplacementReceiptController::class, 'store'])->name('purchase-orders.receive-replacement.store');

// Purchase Orders (view only)
Route::get('purchase-orders', [App\Http\Controllers\Admin\PurchaseOrderController::class, 'index'])->name('purchase-orders.index');
Route::get('purchase-orders/{purchaseOrder}', [App\Http\Controllers\Admin\PurchaseOrderController::class, 'show'])->name('purchase-orders.show');

// Goods Receipt (initial receiving)
Route::get('purchase-orders/{purchaseOrder}/goods-receipt/create', [App\Http\Controllers\Admin\GoodsReceiptController::class, 'create'])->name('goods-receipt.create');
Route::post('purchase-orders/{purchaseOrder}/goods-receipt', [App\Http\Controllers\Admin\GoodsReceiptController::class, 'store'])->name('goods-receipt.store');

   // ✅ Admin notifications
    Route::get('/notifications', [App\Http\Controllers\NotificationController::class, 'indexPage'])
        ->name('notifications.index');

    // Reports (nested prefix)
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\Admin\ReportController::class, 'dashboard'])->name('dashboard');
        Route::get('/sales', [App\Http\Controllers\Admin\ReportController::class, 'sales'])->name('sales');
        Route::get('/inventory', [App\Http\Controllers\Admin\ReportController::class, 'inventory'])->name('inventory');
        Route::get('/stock-movement', [App\Http\Controllers\Admin\ReportController::class, 'stockMovement'])->name('stock-movement');
        Route::get('/attendance', [App\Http\Controllers\Admin\ReportController::class, 'attendance'])->name('attendance');
        Route::get('/payroll', [App\Http\Controllers\Admin\ReportController::class, 'payroll'])->name('payroll');
        Route::get('/capital-vs-sales', [App\Http\Controllers\Admin\ReportController::class, 'capitalVsSales'])->name('capital-vs-sales');
        Route::get('/delivery', [App\Http\Controllers\Admin\ReportController::class, 'delivery'])->name('delivery');


    });


      // Order Management
    Route::get('/orders', [App\Http\Controllers\Admin\OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [App\Http\Controllers\Admin\OrderController::class, 'show'])->name('orders.show');
    Route::put('/orders/{order}/status', [App\Http\Controllers\Admin\OrderController::class, 'updateStatus'])->name('orders.update-status');



    Route::put('/orders/{order}/production-stage', [App\Http\Controllers\Admin\OrderController::class, 'updateProductionStage'])->name('orders.update-production-stage');
Route::post('/orders/{order}/complete-production',[App\Http\Controllers\Admin\OrderController::class, 'completeProduction'])->name('orders.complete-production');

Route::get('/help/material-calculation', [App\Http\Controllers\HelpController::class, 'materialCalculation'])
    ->name('help.material-calculation');

  // Help – Interactive Simulator
Route::get('/help/product-data/{product}', [App\Http\Controllers\HelpController::class, 'getProductData'])
    ->name('help.product-data');
Route::post('/help/material-calculation/simulate', [App\Http\Controllers\HelpController::class, 'simulate'])
    ->name('help.simulate');
});

// ==================== MANAGER ROUTES ====================
Route::middleware(['auth', 'role:manager'])->prefix('manager')->name('manager.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Manager\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/suppliers', [App\Http\Controllers\Manager\SupplierController::class, 'index'])->name('suppliers.index');
    Route::get('/product-categories', [App\Http\Controllers\Manager\ProductCategoryController::class, 'index'])->name('product-categories.index');
    Route::get('/products', [App\Http\Controllers\Manager\ProductController::class, 'index'])->name('products.index');
    Route::get('/delivery-zones', [App\Http\Controllers\Manager\DeliveryZoneController::class, 'index'])->name('delivery-zones.index');

    // Procurement Review
Route::prefix('procurement')->name('procurement.')->group(function () {
    Route::get('/review', [App\Http\Controllers\Manager\ProcurementReviewController::class, 'index'])->name('review.index');
    Route::get('/review/{materialRequest}', [App\Http\Controllers\Manager\ProcurementReviewController::class, 'show'])->name('review.show');
    Route::post('/review/{materialRequest}', [App\Http\Controllers\Manager\ProcurementReviewController::class, 'review'])->name('review.process');

    Route::get('/confirm', [App\Http\Controllers\Manager\ConfirmReceiptController::class, 'index'])->name('confirm.index');
    Route::get('/confirm/{goodsReceipt}', [App\Http\Controllers\Manager\ConfirmReceiptController::class, 'show'])->name('confirm.show');
    Route::post('/confirm/{goodsReceipt}', [App\Http\Controllers\Manager\ConfirmReceiptController::class, 'confirm'])->name('confirm.process');




});

 // ✅ Orders (read-only)
    Route::get('/orders', [App\Http\Controllers\Manager\OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [App\Http\Controllers\Manager\OrderController::class, 'show'])->name('orders.show');


 Route::get('/payments', [App\Http\Controllers\Manager\PaymentController::class, 'index'])->name('payments.index');
 Route::get('/orders/{order}', [App\Http\Controllers\Manager\OrderController::class, 'show'])->name('orders.show');

    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\Manager\ReportController::class, 'dashboard'])->name('dashboard');
        Route::get('/sales', [App\Http\Controllers\Manager\ReportController::class, 'sales'])->name('sales');
        Route::get('/inventory', [App\Http\Controllers\Manager\ReportController::class, 'inventory'])->name('inventory');
        Route::get('/attendance', [App\Http\Controllers\Manager\ReportController::class, 'attendance'])->name('attendance');
        Route::get('/payroll', [App\Http\Controllers\Manager\ReportController::class, 'payroll'])->name('payroll');
        Route::get('/capital-vs-sales', [App\Http\Controllers\Manager\ReportController::class, 'capitalVsSales'])->name('capital-vs-sales');
        Route::get('/delivery', [App\Http\Controllers\Manager\ReportController::class, 'delivery'])->name('delivery');
    });

     // ✅ Manager notifications
    Route::get('/notifications', [App\Http\Controllers\NotificationController::class, 'indexPage'])
        ->name('notifications.index');
});

// ==================== CUSTOMER ROUTES (authenticated only) ====================
Route::middleware(['auth', 'role:customer'])->prefix('customer')->name('customer.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [App\Http\Controllers\Customer\DashboardController::class, 'index'])->name('dashboard');

    // Cart
    Route::get('/cart', [App\Http\Controllers\Customer\CartController::class, 'index'])->name('cart.index');
    Route::post('/cart/quick-add', [App\Http\Controllers\Customer\CartController::class, 'quickAdd'])->name('cart.quick-add');
    Route::post('/cart/add', [App\Http\Controllers\Customer\CartController::class, 'add'])->name('cart.add');
    Route::put('/cart/update', [App\Http\Controllers\Customer\CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/remove', [App\Http\Controllers\Customer\CartController::class, 'remove'])->name('cart.remove');

    // Checkout
    Route::get('/checkout', [App\Http\Controllers\Customer\CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('/checkout', [App\Http\Controllers\Customer\CheckoutController::class, 'store'])->name('checkout.store');

    // Inside 'customer' group
Route::get('/zone-by-coordinates', [App\Http\Controllers\Customer\CheckoutController::class, 'getZoneByCoordinates'])
    ->name('zone.by.coordinates');

    // Orders
   Route::get('/orders', [App\Http\Controllers\Customer\OrderController::class, 'index'])->name('orders.index');
Route::get('/orders/{order}', [App\Http\Controllers\Customer\OrderController::class, 'show'])->name('orders.show');


    // Tracking (public, but can be here; we also have a public tracking route but it's fine)
    Route::get('/tracking/{trackingNumber}', [App\Http\Controllers\Customer\TrackingController::class, 'show'])->name('tracking.show');



    // Customer payment routes (add inside customer group)
Route::get('/payment/success', [App\Http\Controllers\Customer\PaymentController::class, 'success'])->name('customer.payment.success');
Route::get('/payment/cancel', [App\Http\Controllers\Customer\PaymentController::class, 'cancel'])->name('customer.payment.cancel');
});


// routes/api.php (or web.php)
Route::post('/webhooks/paymongo', [App\Http\Controllers\WebhookController::class, 'handlePayMongo'])->name('webhooks.paymongo');

// ==================== DELIVERY DRIVER ROUTES ====================
Route::middleware(['auth', 'role:driver'])->prefix('driver')->name('driver.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\DeliveryDriver\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/deliveries', [App\Http\Controllers\DeliveryDriver\DeliveryController::class, 'index'])->name('deliveries.index');
    Route::get('/deliveries/{delivery}', [App\Http\Controllers\DeliveryDriver\DeliveryController::class, 'show'])->name('deliveries.show');
    Route::post('/deliveries/{delivery}/update-status', [App\Http\Controllers\DeliveryDriver\DeliveryController::class, 'updateStatus'])->name('deliveries.update-status');
});
