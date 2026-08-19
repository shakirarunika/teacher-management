<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Pengingat akses akan habis. Sengaja TIDAK implement ShouldQueue —
 * belum ada queue worker, dikirim langsung dari scheduler harian.
 */
class SubscriptionEnding extends Notification
{
    public function __construct(private int $daysLeft) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $label = $notifiable->subscription_ends_at?->isFuture() ? 'Langganan' : 'Masa coba';
        $tanggal = $notifiable->accessEndsAt()->translatedFormat('j F Y');

        return (new MailMessage)
            ->subject("{$label} Anda berakhir dalam {$this->daysLeft} hari")
            ->greeting("Halo, {$notifiable->name}")
            ->line("{$label} Anda di " . config('app.name') . " berakhir pada {$tanggal} ({$this->daysLeft} hari lagi).")
            ->line('Setelah itu dashboard, absensi, dan nilai terkunci sampai diperpanjang. Data Anda tetap aman tersimpan.')
            ->action('Lihat Status Langganan', route('billing'))
            ->line('Mau perpanjang? Balas email ini dan admin akan membantu.');
    }
}
