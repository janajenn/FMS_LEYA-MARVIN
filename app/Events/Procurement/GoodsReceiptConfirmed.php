<?php

namespace App\Events\Procurement;

use App\Models\GoodsReceipt;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GoodsReceiptConfirmed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public GoodsReceipt $goodsReceipt;

    public function __construct(GoodsReceipt $goodsReceipt)
    {
        $this->goodsReceipt = $goodsReceipt;
    }
}
