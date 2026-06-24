<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /** Lama masa coba gratis untuk guru baru (hari). */
    private const TRIAL_DAYS = 14;

    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'teacher',
        ]);

        // Mulai masa coba gratis
        $user->trial_ends_at = now()->addDays(self::TRIAL_DAYS);
        $user->save();

        // Onboarding: buat tahun ajaran aktif default agar dashboard & input langsung jalan
        AcademicYear::create([
            'name' => $this->currentSchoolYear(),
            'is_active' => true,
            'user_id' => $user->id,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect()->route('dashboard');
    }

    /** Tahun ajaran berjalan, mis. "2026/2027" (tahun ajaran dimulai Juli). */
    private function currentSchoolYear(): string
    {
        $year = (int) date('Y');
        $start = (int) date('n') >= 7 ? $year : $year - 1;

        return $start . '/' . ($start + 1);
    }
}
