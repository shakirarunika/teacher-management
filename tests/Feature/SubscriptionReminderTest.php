<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\SubscriptionEnding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Pengingat hanya dikirim tepat H-7 dan H-1, dan memakai tanggal akses
 * terakhir (langganan mengalahkan trial yang lebih dulu habis).
 */
class SubscriptionReminderTest extends TestCase
{
    use RefreshDatabase;

    private function teacher(array $attributes): User
    {
        return User::factory()->create($attributes + ['role' => 'teacher']);
    }

    public function test_mengirim_pengingat_h7_dan_h1_saja(): void
    {
        Notification::fake();

        $h7 = $this->teacher(['trial_ends_at' => now()->addDays(7)]);
        $h1 = $this->teacher(['trial_ends_at' => now()->addDay()]);
        $h5 = $this->teacher(['trial_ends_at' => now()->addDays(5)]);
        $habis = $this->teacher(['trial_ends_at' => now()->subDay()]);

        $this->artisan('subscriptions:remind')->assertSuccessful();

        Notification::assertSentTo($h7, SubscriptionEnding::class);
        Notification::assertSentTo($h1, SubscriptionEnding::class);
        Notification::assertNotSentTo($h5, SubscriptionEnding::class);
        Notification::assertNotSentTo($habis, SubscriptionEnding::class);
    }

    public function test_memakai_tanggal_akses_terakhir_bukan_trial_saja(): void
    {
        Notification::fake();

        // Trial habis besok, tapi langganan masih 30 hari — jangan diganggu.
        $berlangganan = $this->teacher([
            'trial_ends_at' => now()->addDay(),
            'subscription_ends_at' => now()->addDays(30),
        ]);

        $this->artisan('subscriptions:remind')->assertSuccessful();

        Notification::assertNotSentTo($berlangganan, SubscriptionEnding::class);
        $this->assertTrue($berlangganan->accessEndsAt()->isSameDay(now()->addDays(30)));
    }

    public function test_admin_tidak_dikirimi_pengingat(): void
    {
        Notification::fake();

        $admin = User::factory()->create(['role' => 'admin', 'trial_ends_at' => now()->addDay()]);

        $this->artisan('subscriptions:remind')->assertSuccessful();

        Notification::assertNotSentTo($admin, SubscriptionEnding::class);
    }
}
