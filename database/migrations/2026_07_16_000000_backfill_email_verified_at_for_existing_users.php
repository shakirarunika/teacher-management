<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Verifikasi email baru diaktifkan sekarang (MustVerifyEmail). User lama
 * mendaftar sebelum fitur ini ada — tandai terverifikasi supaya tidak
 * mendadak terkunci di layar verifikasi saat deploy.
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
