<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blokir guru yang masa coba/langganannya habis. Data tidak dihapus —
 * mereka diarahkan ke halaman billing sampai berlangganan lagi.
 */
class EnsureActiveSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->hasActiveAccess()) {
            return redirect()->route('billing');
        }

        return $next($request);
    }
}
