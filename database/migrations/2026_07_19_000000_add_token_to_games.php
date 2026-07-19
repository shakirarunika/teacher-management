<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            // Halaman main diakses via token (tanpa sesi login guru) — laptop yang
            // dipegang siswa tidak membawa akses akun guru.
            $table->string('token', 8)->nullable()->unique()->after('name');
        });

        foreach (DB::table('games')->whereNull('token')->pluck('id') as $id) {
            DB::table('games')->where('id', $id)->update(['token' => Str::lower(Str::random(8))]);
        }
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('token');
        });
    }
};
