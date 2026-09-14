<?php

namespace App\Events\Procurement;

use App\Models\MaterialRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReplacementRequestReviewed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public MaterialRequest $materialRequest;
    public string $action; // 'approved', 'rejected'

    public function __construct(MaterialRequest $materialRequest, string $action)
    {
        $this->materialRequest = $materialRequest;
        $this->action = $action;
    }
}
