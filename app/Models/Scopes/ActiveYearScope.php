<?php

namespace App\Models\Scopes;

use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Batasi query hanya pada data tahun ajaran aktif guru yang login.
 * Admin (dan konteks tanpa login: CLI, queue, seeder) melihat semua tahun.
 */
class ActiveYearScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $user = auth()->user();

        if ($user && $user->role === 'teacher') {
            // Subquery: AcademicYear ter-OwnerScope, jadi otomatis milik guru ini.
            $builder->whereIn(
                $model->getTable() . '.academic_year_id',
                AcademicYear::where('is_active', true)->select('id')
            );
        }
    }
}
