<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;

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

    public function import(Request $request, Classroom $classroom)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:2048',
        ]);

        try {
            $rows = IOFactory::load($request->file('file')->getRealPath())
                ->getActiveSheet()
                ->toArray(null, true, true, false);
        } catch (\Throwable $e) {
            return back()->withErrors(['file' => 'File tidak bisa dibaca. Pastikan formatnya Excel (.xlsx) atau CSV.']);
        }

        if (count($rows) > 501) {
            return back()->withErrors(['file' => 'Maksimal 500 baris per import.']);
        }

        // Lewati baris header (baris pertama yang kolom L/P-nya bukan jenis kelamin valid)
        if ($rows && $this->parseGender($rows[0][1] ?? '') === null) {
            array_shift($rows);
        }

        $existingNis = Student::pluck('nis')->flip(); // OwnerScope: NIS milik guru ini saja
        $imported = 0;
        $skipped = [];

        DB::transaction(function () use ($rows, $classroom, $existingNis, &$imported, &$skipped) {
            $yearId = AcademicYear::where('is_active', true)->value('id');

            foreach ($rows as $i => $row) {
                $line = $i + 1;
                $name = trim((string) ($row[0] ?? ''));
                $gender = $this->parseGender($row[1] ?? '');
                $nis = trim((string) ($row[2] ?? ''));

                if ($name === '' && $gender === null && $nis === '') continue; // baris kosong

                if ($name === '' || mb_strlen($name) > 255) {
                    $skipped[] = "Baris {$line}: nama kosong/terlalu panjang";
                    continue;
                }
                if ($gender === null) {
                    $skipped[] = "Baris {$line}: jenis kelamin harus L atau P";
                    continue;
                }
                if ($nis !== '' && isset($existingNis[$nis])) {
                    $skipped[] = "Baris {$line}: NIS {$nis} sudah dipakai";
                    continue;
                }

                $nis = $nis !== '' ? $nis : Student::generateNis();
                $existingNis[$nis] = true;

                $student = Student::create(['name' => $name, 'gender' => $gender, 'nis' => $nis]);
                $classroom->students()->attach($student->id, ['academic_year_id' => $yearId]);
                $imported++;
            }
        });

        if ($imported === 0) {
            return back()
                ->withErrors(['file' => 'Tidak ada siswa yang berhasil diimpor.'])
                ->with('import_skipped', $skipped);
        }

        return back()
            ->with('success', "{$imported} siswa berhasil diimpor" . ($skipped ? ', ' . count($skipped) . ' baris dilewati.' : '!'))
            ->with('import_skipped', $skipped);
    }

    private function parseGender($value): ?string
    {
        $g = strtoupper(trim((string) $value));
        if ($g === '') return null;
        if ($g === 'PRIA' || str_starts_with($g, 'L')) return 'L';
        if ($g === 'WANITA' || str_starts_with($g, 'P')) return 'P';
        return null;
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
