<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * email_verified_at sempat tidak fillable, jadi akun buatan admin di Filament
 * tersimpan tanpa verifikasi dan terjebak di layar verifikasi email (tanpa
 * SMTP tak bisa keluar). Registrasi publik tutup — semua akun buatan admin,
 * aman ditandai terverifikasi.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        // Tidak bisa dibedakan lagi mana yang backfill — biarkan.
    }
};
