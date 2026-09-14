<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        // Procurement Events
        \App\Events\Procurement\MaterialRequestSubmitted::class => [
            \App\Listeners\Procurement\NotifyManagerNewMaterialRequest::class,
        ],
        \App\Events\Procurement\MaterialRequestReviewed::class => [
            \App\Listeners\Procurement\NotifyAdminMaterialRequestReviewed::class,
        ],
        \App\Events\Procurement\PurchaseOrderGenerated::class => [
            \App\Listeners\Procurement\NotifyAdminPurchaseOrderGenerated::class,
        ],
        \App\Events\Procurement\GoodsReceiptCreated::class => [
            \App\Listeners\Procurement\NotifyManagerGoodsReceiptCreated::class,
        ],
        \App\Events\Procurement\GoodsReceiptConfirmed::class => [
            \App\Listeners\Procurement\NotifyAdminGoodsReceiptConfirmed::class,
        ],
        \App\Events\Procurement\ReplacementRequestSubmitted::class => [
            \App\Listeners\Procurement\NotifyManagerReplacementRequestSubmitted::class,
        ],
        \App\Events\Procurement\ReplacementRequestReviewed::class => [
            \App\Listeners\Procurement\NotifyAdminReplacementRequestReviewed::class,
        ],
    ];

    public function boot(): void
    {
        //
    }
}
