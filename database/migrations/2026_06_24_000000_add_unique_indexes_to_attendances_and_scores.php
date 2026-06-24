<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bersihkan duplikat lama (simpan baris id terbesar) agar unique index bisa dibuat
        DB::statement('DELETE a1 FROM attendances a1 INNER JOIN attendances a2
            WHERE a1.id < a2.id
            AND a1.classroom_id = a2.classroom_id
            AND a1.student_id = a2.student_id
            AND a1.date = a2.date');

        DB::statement('DELETE s1 FROM scores s1 INNER JOIN scores s2
            WHERE s1.id < s2.id
            AND s1.classroom_id = s2.classroom_id
            AND s1.student_id = s2.student_id
            AND s1.subject_id = s2.subject_id');

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
