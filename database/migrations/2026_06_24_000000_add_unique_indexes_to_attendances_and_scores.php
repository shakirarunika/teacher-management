<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bersihkan duplikat lama (simpan baris id terbesar) agar unique index bisa dibuat.
        // Sintaks portabel MySQL + SQLite (DELETE JOIN tidak jalan di sqlite/test).
        DB::statement('DELETE FROM attendances WHERE id NOT IN (
            SELECT * FROM (SELECT MAX(id) FROM attendances GROUP BY classroom_id, student_id, date) t)');

        DB::statement('DELETE FROM scores WHERE id NOT IN (
            SELECT * FROM (SELECT MAX(id) FROM scores GROUP BY classroom_id, student_id, subject_id) t)');

        Schema::table('attendances', function (Blueprint $table) {
            $table->unique(['classroom_id', 'student_id', 'date']);
        });

        Schema::table('scores', function (Blueprint $table) {
            $table->unique(['classroom_id', 'student_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique(['classroom_id', 'student_id', 'date']);
        });

        Schema::table('scores', function (Blueprint $table) {
            $table->dropUnique(['classroom_id', 'student_id', 'subject_id']);
        });
    }
};
