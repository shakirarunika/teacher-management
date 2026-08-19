<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Backup dini hari, pengingat pagi sebelum guru mulai ngajar.
// Butuh `php artisan schedule:run` tiap menit (lihat deploy.sh).
Schedule::command('backup:database')->dailyAt('01:00');
Schedule::command('subscriptions:remind')->dailyAt('07:00');
