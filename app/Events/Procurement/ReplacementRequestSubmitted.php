<?php

namespace App\Events\Procurement;

use App\Models\MaterialRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReplacementRequestSubmitted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public MaterialRequest $materialRequest;

    public function __construct(MaterialRequest $materialRequest)
    {
        $this->materialRequest = $materialRequest;
    }
}
