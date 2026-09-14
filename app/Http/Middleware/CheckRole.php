<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!Auth::check()) {
            abort(403, 'Unauthorized.');
        }

        $user = Auth::user();
        if (!$user->role || !in_array($user->role->slug, $roles)) {
            abort(403, 'Unauthorized.');
        }

        return $next($request);
    }
}
