<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_questions', function (Blueprint $table) {
            // Kunci PG kompleks: array index pilihan yang benar, mis. [1, 3]
            $table->json('answers')->nullable()->after('answer');
        });

        // Tipe esai dihapus dari aplikasi — soal esai lama ikut dibuang
        DB::table('bank_questions')->where('type', 'esai')->delete();

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropColumn('manual_points'); // penilaian manual ikut hilang bersama esai
        });
    }

    public function down(): void
    {
        Schema::table('bank_questions', function (Blueprint $table) {
            $table->dropColumn('answers');
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->json('manual_points')->nullable()->after('answers');
        });
    }
};
