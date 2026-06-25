<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
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
