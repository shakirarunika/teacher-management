<?php

namespace App\Filament\Resources\Students\Schemas;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Student;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class StudentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Data Siswa')
                    ->schema([
                        TextInput::make('nis')
                            ->label('NIS')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->default(fn () => Student::generateNis())
                            ->dehydrated()
                            ->readOnly(fn (?Student $record) => $record === null)
                            ->helperText(fn (?Student $record) => $record === null
                                ? 'NIS digenerate otomatis, bisa diedit setelah disimpan'
                                : null),
                        TextInput::make('name')
                            ->label('Nama Siswa')
                            ->required(),
                        Select::make('gender')
                            ->label('Jenis Kelamin')
                            ->options(['L' => 'Laki-laki', 'P' => 'Perempuan'])
                            ->required(),
                        DatePicker::make('date_of_birth')
                            ->label('Tanggal Lahir'),
                        Textarea::make('address')
                            ->label('Alamat')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Penempatan Kelas')
                    ->schema([
                        Select::make('classroom_id')
                            ->label('Kelas')
                            ->options(Classroom::query()->pluck('name', 'id'))
                            ->searchable()
                            ->required()
                            ->helperText('Pilih kelas untuk siswa ini'),
                        Select::make('academic_year_id')
                            ->label('Tahun Ajaran')
                            ->options(AcademicYear::query()->pluck('name', 'id'))
                            ->default(fn () => AcademicYear::where('is_active', true)->value('id'))
                            ->searchable()
                            ->required()
                            ->helperText('Tahun ajaran aktif dipilih otomatis'),
                    ])
                    ->columns(2)
                    ->visibleOn('create'),
            ]);
    }
}
