<?php

namespace App\Filament\Resources\Students\Pages;

use App\Filament\Resources\Students\StudentResource;
use Filament\Resources\Pages\CreateRecord;

class CreateStudent extends CreateRecord
{
    protected static string $resource = StudentResource::class;

    /**
     * Setelah siswa berhasil dibuat, masukkan ke pivot classroom_student
     * berdasarkan kelas dan tahun ajaran yang dipilih di form.
     */
    protected function afterCreate(): void
    {
        $classroomId = $this->data['classroom_id'] ?? null;
        $academicYearId = $this->data['academic_year_id'] ?? null;

        if ($classroomId) {
            $this->record->classrooms()->attach($classroomId, [
                'academic_year_id' => $academicYearId,
            ]);
        }
    }

    /**
     * Exclude classroom_id dan academic_year_id dari data yang di-save ke tabel students
     * karena field itu bukan kolom di tabel students, tapi untuk pivot.
     */
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        unset($data['classroom_id'], $data['academic_year_id']);

        return $data;
    }
}
