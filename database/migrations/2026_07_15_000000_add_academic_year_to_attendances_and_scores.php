<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['attendances', 'scores'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->foreignId('academic_year_id')->nullable()->constrained()->nullOnDelete();
            });

            // Backfill: data lama dianggap milik tahun ajaran aktif guru pemilik kelasnya.
            // Sintaks portabel MySQL + SQLite.
            DB::statement("UPDATE {$table} SET academic_year_id = (
                SELECT ay.id FROM academic_years ay
                JOIN classrooms c ON c.teacher_id = ay.user_id
                WHERE c.id = {$table}.classroom_id AND ay.is_active = 1
                LIMIT 1
            )");

            // Fallback: guru punya tahun ajaran tapi tidak ada yang aktif -> tahun terbaru.
            // Guru tanpa tahun sama sekali tetap NULL (diadopsi saat bikin tahun pertama).
            DB::statement("UPDATE {$table} SET academic_year_id = (
                SELECT ay.id FROM academic_years ay
                JOIN classrooms c ON c.teacher_id = ay.user_id
                WHERE c.id = {$table}.classroom_id
                ORDER BY ay.id DESC LIMIT 1
            ) WHERE academic_year_id IS NULL");
        }

        // Nilai per tahun ajaran hidup berdampingan, bukan saling timpa.
        // (Unique absensi tidak perlu diubah — tanggal sudah membedakan tahun.)
        // Unique baru DULU baru drop yang lama — index lama dipakai MySQL
        // sebagai backing FK classroom_id, tidak bisa di-drop tanpa pengganti.
        Schema::table('scores', function (Blueprint $t) {
            $t->unique(['classroom_id', 'student_id', 'subject_id', 'academic_year_id'], 'scores_class_student_subject_year_unique');
            $t->dropUnique(['classroom_id', 'student_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::table('scores', function (Blueprint $t) {
            $t->unique(['classroom_id', 'student_id', 'subject_id']);
            $t->dropUnique('scores_class_student_subject_year_unique');
        });

        foreach (['attendances', 'scores'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropConstrainedForeignId('academic_year_id');
            });
        }
    }
};
