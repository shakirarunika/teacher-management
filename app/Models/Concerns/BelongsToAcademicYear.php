<?php

namespace App\Models\Concerns;

use App\Models\AcademicYear;
use App\Models\Scopes\ActiveYearScope;

/**
 * Data terikat tahun ajaran (absensi, nilai).
 * Otomatis: query terfilter ke tahun ajaran aktif guru (ActiveYearScope)
 * + isi academic_year_id saat create. Ganti tahun aktif = mulai bersih,
 * data tahun lama tetap utuh dan muncul lagi saat tahunnya diaktifkan ulang.
 */
trait BelongsToAcademicYear
{
    public static function bootBelongsToAcademicYear(): void
    {
        static::addGlobalScope(new ActiveYearScope);

        static::creating(function ($model) {
            // Dalam konteks guru selalu dipaksa ke tahun aktif miliknya
            // (AcademicYear sudah ter-OwnerScope). Admin/CLI: nilai eksplisit.
            if (auth()->user()?->role === 'teacher') {
                $model->academic_year_id = AcademicYear::where('is_active', true)->value('id');
            }
        });
    }
}
