<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
use App\Models\AcademicYear;
use Filament\Resources\Pages\CreateRecord;

class CreateUser extends CreateRecord
{
    protected static string $resource = UserResource::class;

    /**
     * Guru baru butuh tahun ajaran aktif supaya dashboard & input langsung
     * jalan (dulu dibuat saat registrasi mandiri — sekarang akun dibuat admin).
     */
    protected function afterCreate(): void
    {
        if ($this->record->role !== 'teacher') {
            return;
        }

        $year = (int) date('Y');
        $start = (int) date('n') >= 7 ? $year : $year - 1;

        AcademicYear::create([
            'name' => $start . '/' . ($start + 1),
            'is_active' => true,
            'user_id' => $this->record->id,
        ]);
    }
}
