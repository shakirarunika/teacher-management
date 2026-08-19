<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\SubscriptionEnding;
use Illuminate\Console\Command;

class SendSubscriptionReminders extends Command
{
    protected $signature = 'subscriptions:remind';

    protected $description = 'Kirim email pengingat ke guru yang aksesnya habis dalam 7 atau 1 hari';

    /** Sisa hari yang dikirimi pengingat. */
    private const DAYS = [7, 1];

    public function handle(): int
    {
        // Persempit dulu lewat SQL, cocokkan hari persisnya di PHP —
        // GREATEST() beda perilaku antar MySQL/SQLite, tidak worth di-query.
        $window = [now()->startOfDay(), now()->addDays(max(self::DAYS) + 1)->endOfDay()];

        $sent = 0;

        User::where('role', 'teacher')
            ->where(fn ($q) => $q->whereBetween('trial_ends_at', $window)
                ->orWhereBetween('subscription_ends_at', $window))
            ->cursor()
            ->each(function (User $user) use (&$sent) {
                $end = $user->accessEndsAt();

                if (! $end) {
                    return;
                }

                $daysLeft = (int) now()->startOfDay()->diffInDays($end->copy()->startOfDay(), false);

                if (! in_array($daysLeft, self::DAYS, true)) {
                    return;
                }

                $user->notify(new SubscriptionEnding($daysLeft));
                $sent++;
            });

        // ponytail: idempoten karena dicocokkan per tanggal & dijadwalkan sekali sehari.
        // Kalau scheduler mati seharian, pengingat hari itu terlewat (tidak dikejar).
        // Butuh jaminan terkirim? Tambah kolom last_reminded_at.
        $this->info("{$sent} pengingat dikirim.");

        return self::SUCCESS;
    }
}
