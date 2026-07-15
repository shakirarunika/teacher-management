<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Score;
use App\Models\Scopes\ActiveYearScope;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    // OwnerScope membatasi semua query & binding {academicYear} ke milik guru login.

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);

        $year = AcademicYear::create(['name' => $request->name]); // user_id otomatis

        // Jika guru belum punya tahun ajaran aktif, jadikan ini aktif.
        if (! AcademicYear::where('is_active', true)->where('id', '!=', $year->id)->exists()) {
            $year->update(['is_active' => true]);

            // Adopsi data lama tanpa tahun (dibuat sebelum guru punya tahun ajaran)
            // agar tidak tersembunyi oleh ActiveYearScope.
            $classroomIds = Classroom::where('teacher_id', $request->user()->id)->pluck('id');
            foreach ([Attendance::class, Score::class] as $model) {
                $model::withoutGlobalScope(ActiveYearScope::class)
                    ->whereNull('academic_year_id')
                    ->whereIn('classroom_id', $classroomIds)
                    ->update(['academic_year_id' => $year->id]);
            }
        }

        return back()->with('success', 'Tahun ajaran ditambahkan!');
    }

    public function update(Request $request, AcademicYear $academicYear)
    {
        $request->validate(['name' => 'required|string|max:255']);

        $academicYear->update(['name' => $request->name]);

        return back()->with('success', 'Tahun ajaran diperbarui!');
    }

    public function activate(AcademicYear $academicYear)
    {
        // Hanya satu tahun ajaran aktif per guru (query ter-scope OwnerScope).
        AcademicYear::where('is_active', true)->update(['is_active' => false]);
        $academicYear->update(['is_active' => true]);

        return back()->with('success', "Tahun ajaran aktif: {$academicYear->name}");
    }

    public function destroy(AcademicYear $academicYear)
    {
        // Pivot classroom_student.academic_year_id di-set null (nullOnDelete).
        $academicYear->delete();

        return back()->with('success', 'Tahun ajaran dihapus!');
    }
}
