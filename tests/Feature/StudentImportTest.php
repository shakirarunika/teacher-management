<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class StudentImportTest extends TestCase
{
    use RefreshDatabase;

    private function makeTeacherWithClassroom(): array
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'trial_ends_at' => now()->addWeek(),
        ]);
        $this->actingAs($teacher);

        AcademicYear::create(['name' => '2026/2027', 'is_active' => true, 'user_id' => $teacher->id]);
        $classroom = Classroom::create(['name' => 'Kelas 10A', 'teacher_id' => $teacher->id, 'user_id' => $teacher->id]);

        return [$teacher, $classroom];
    }

    private function makeXlsx(array $rows): UploadedFile
    {
        $ss = new Spreadsheet();
        $ss->getActiveSheet()->fromArray($rows);
        $path = tempnam(sys_get_temp_dir(), 'imp') . '.xlsx';
        (new Xlsx($ss))->save($path);

        return new UploadedFile($path, 'siswa.xlsx', null, null, true);
    }

    public function test_import_creates_students_skips_bad_rows_and_header(): void
    {
        [$teacher, $classroom] = $this->makeTeacherWithClassroom();

        Student::create(['name' => 'Sudah Ada', 'gender' => 'L', 'nis' => '999', 'user_id' => $teacher->id]);

        $file = $this->makeXlsx([
            ['Nama', 'JK', 'NIS'],              // header -> dilewati
            ['Budi Santoso', 'L', '20260001'],
            ['Siti Aminah', 'Perempuan', ''],   // NIS kosong -> auto
            ['Tanpa Gender', 'X', '123'],       // gender invalid -> skip
            ['Dobel NIS', 'P', '999'],          // NIS bentrok -> skip
        ]);

        $response = $this->post(route('students.import', $classroom), ['file' => $file]);

        $response->assertRedirect()->assertSessionHas('success');
        $this->assertCount(2, session('import_skipped'));

        $this->assertDatabaseHas('students', ['name' => 'Budi Santoso', 'nis' => '20260001', 'gender' => 'L']);
        $this->assertDatabaseHas('students', ['name' => 'Siti Aminah', 'gender' => 'P']);
        $this->assertDatabaseMissing('students', ['name' => 'Tanpa Gender']);
        $this->assertDatabaseMissing('students', ['name' => 'Dobel NIS']);

        // Semua siswa hasil import masuk ke kelas
        $this->assertEquals(2, $classroom->students()->count());
    }

    public function test_import_rejects_foreign_classroom(): void
    {
        [, $classroom] = $this->makeTeacherWithClassroom();

        $other = User::factory()->create(['role' => 'teacher', 'trial_ends_at' => now()->addWeek()]);
        $this->actingAs($other);

        $this->post(route('students.import', $classroom), ['file' => $this->makeXlsx([['A', 'L', '']])])
            ->assertNotFound(); // OwnerScope: kelas guru lain tidak terlihat
    }
}
