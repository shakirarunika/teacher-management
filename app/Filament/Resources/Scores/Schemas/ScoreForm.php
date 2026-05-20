<?php

namespace App\Filament\Resources\Scores\Schemas;

use App\Models\Classroom;
use App\Models\Student;
use App\Models\Subject;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class ScoreForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('student_id')
                    ->label('Siswa')
                    ->options(Student::orderBy('name')->pluck('name', 'id'))
                    ->searchable()
                    ->required(),

                Select::make('classroom_id')
                    ->label('Kelas')
                    ->options(Classroom::orderBy('name')->pluck('name', 'id'))
                    ->searchable()
                    ->required(),

                Select::make('subject_id')
                    ->label('Mata Pelajaran')
                    ->options(Subject::pluck('name', 'id'))
                    ->searchable()
                    ->required(),

                TextInput::make('tugas')
                    ->label('Nilai Tugas (20%)')
                    ->numeric()
                    ->minValue(0)
                    ->maxValue(100),

                TextInput::make('pts')
                    ->label('Nilai PTS (10%)')
                    ->numeric()
                    ->minValue(0)
                    ->maxValue(100),

                TextInput::make('pas')
                    ->label('Nilai PAS (40%)')
                    ->numeric()
                    ->minValue(0)
                    ->maxValue(100),
            ]);
    }
}
