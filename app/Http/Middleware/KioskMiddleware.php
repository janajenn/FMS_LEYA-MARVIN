<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class KioskMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $kioskId = $request->header('X-Kiosk-ID');
        
        if (!$kioskId) {
            return response()->json(['message' => 'Missing X-Kiosk-ID header'], 400);
        }

        // Attach it to the request so controllers can use it
        $request->merge(['kiosk_id' => $kioskId]);

        return $next($request);
    }
}