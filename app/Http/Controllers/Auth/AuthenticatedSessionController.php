<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user();

        // Maks 2 sesi aktif per akun (anti akun dibagi/dijual ulang): sisakan
        // 1 sesi lain terbaru — sesi request ini baru ditulis ke DB di akhir
        // request, jadi totalnya 2. Butuh SESSION_DRIVER=database.
        $stale = DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $request->session()->getId())
            ->orderByDesc('last_activity')
            ->skip(1)->take(500)->pluck('id');
        if ($stale->isNotEmpty()) {
            DB::table('sessions')->whereIn('id', $stale)->delete();
        }

        // Rotasi token "ingat saya" — tanpa ini perangkat yang ditendang
        // auto-login lagi lewat cookie remember dan batas sesi jadi bolong.
        // login() ulang meng-queue cookie baru untuk perangkat ini.
        $user->setRememberToken(Str::random(60));
        $user->save();
        if ($request->boolean('remember')) {
            Auth::guard('web')->login($user, true);
        }
        if ($user && $user->role === 'admin') {
            return redirect()->intended('/admin');
        }

        // If the logged-in user is a teacher, prevent redirecting to admin panel routes
        $intended = $request->session()->get('url.intended');
        if ($intended && (str_contains($intended, '/admin') || str_contains($intended, '/admin/'))) {
            $request->session()->forget('url.intended');
            return redirect()->route('dashboard');
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
