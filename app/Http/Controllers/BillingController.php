<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class BillingController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Billing', [
            'status' => [
                'active' => $user->hasActiveAccess(),
                'on_trial' => (bool) $user->trial_ends_at?->isFuture(),
                'trial_ends_at' => $user->trial_ends_at,
                'subscription_ends_at' => $user->subscription_ends_at,
            ],
        ]);
    }
}
