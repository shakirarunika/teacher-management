<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Tabel yang datanya dimiliki per guru (tenant). */
    private array $tables = ['students', 'subjects', 'academic_years', 'holidays', 'assessment_types'];

    public function up(): void
    {
        // 1. Tambah kolom pemilik (nullable agar data lama tidak error)
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
            });
        }

        // 2. Backfill data lama ke guru pemiliknya
        // Siswa: ikut guru dari kelas tempat dia terdaftar
        DB::statement('UPDATE students SET user_id = (
            SELECT c.teacher_id FROM classroom_student cs
            JOIN classrooms c ON c.id = cs.classroom_id
            WHERE cs.student_id = students.id LIMIT 1
        )');

        // Data global lama (mapel, tahun ajaran, libur, jenis penilaian) -> guru pertama
        $firstTeacherId = DB::table('users')->where('role', 'teacher')->orderBy('id')->value('id');
        if ($firstTeacherId) {
            foreach (['subjects', 'academic_years', 'holidays', 'assessment_types'] as $table) {
                DB::table($table)->update(['user_id' => $firstTeacherId]);
            }
        }

        // 3. Unik per guru, bukan global
        Schema::table('students', function (Blueprint $t) {
            $t->dropUnique(['nis']);
            $t->unique(['user_id', 'nis']);
        });

        Schema::table('holidays', function (Blueprint $t) {
            $t->dropUnique(['date']);
            $t->unique(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::table('holidays', function (Blueprint $t) {
            $t->dropUnique(['user_id', 'date']);
            $t->unique(['date']);
        });

        Schema::table('students', function (Blueprint $t) {
            $t->dropUnique(['user_id', 'nis']);
            $t->unique(['nis']);
        });

        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropConstrainedForeignId('user_id');
            });
        }
    }
};
