<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StudentController extends Controller
{
    // OwnerScope membatasi {classroom} & {student} ke milik guru yang login.

    public function index(Request $request, Classroom $classroom)
    {
        $students = $classroom->students()
            ->orderBy('name')
            ->get(['students.id', 'nis', 'name', 'gender']);

        return Inertia::render('Students/Index', [
            'classroom' => $classroom->only(['id', 'name']),
            'students' => $students,
        ]);
    }

    public function store(Request $request, Classroom $classroom)
    {
        $validated = $this->validateStudent($request);

        $validated['nis'] = $validated['nis'] ?: Student::generateNis();

        $student = Student::create($validated); // user_id diisi otomatis

        $classroom->students()->attach($student->id, [
            'academic_year_id' => AcademicYear::where('is_active', true)->value('id'),
        ]);

        return back()->with('success', 'Siswa berhasil ditambahkan!');
    }

    public function update(Request $request, Classroom $classroom, Student $student)
    {
        $student->update($this->validateStudent($request, $student->id));

        return back()->with('success', 'Data siswa berhasil diperbarui!');
    }

    public function destroy(Classroom $classroom, Student $student)
    {
        // ponytail: hapus siswa sepenuhnya (cascade pivot/nilai/absensi).
        // Asumsi 1 siswa = 1 kelas. Kalau nanti siswa bisa multi-kelas, ganti jadi detach().
        $student->delete();

        return back()->with('success', 'Siswa berhasil dihapus!');
    }

    private function validateStudent(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'gender' => 'required|in:L,P',
            'nis' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('students', 'nis')
                    ->where('user_id', $request->user()->id)
                    ->ignore($ignoreId),
            ],
        ]);
    }
}
