<?php

namespace App\Filament\Resources\Scores\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use App\Models\Classroom;
use App\Models\Subject;

class ScoresTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('student.name')
                    ->label('Nama Siswa')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('classroom.name')
                    ->label('Kelas')
                    ->sortable()
                    ->badge()
                    ->color('primary'),
                TextColumn::make('subject.name')
                    ->label('Mata Pelajaran')
                    ->sortable()
                    ->badge()
                    ->color('success'),
                TextColumn::make('tugas')
                    ->label('Tugas (20%)')
                    ->numeric()
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('pts')
                    ->label('PTS (10%)')
                    ->numeric()
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('pas')
                    ->label('PAS (40%)')
                    ->numeric()
                    ->alignCenter()
                    ->sortable(),
                TextColumn::make('final_score')
                    ->label('Final Score')
                    ->alignCenter()
                    ->badge()
                    ->getStateUsing(function ($record) {
                        // Kehadiran Score dari attendance
                        $totalDays = $record->student->attendances()
                            ->where('classroom_id', $record->classroom_id)
                            ->count();
                        $totalHadir = $record->student->attendances()
                            ->where('classroom_id', $record->classroom_id)
                            ->where('status', 'Hadir')
                            ->count();
                        $totalAlpha = $record->student->attendances()
                            ->where('classroom_id', $record->classroom_id)
                            ->where('status', 'Alpha')
                            ->count();

                        if ($totalAlpha >= 3) return 76;

                        $kehadiran = $totalDays > 0 ? round(($totalHadir / $totalDays) * 100) : 0;
                        $final = ($kehadiran * 0.3) + (($record->tugas ?? 0) * 0.2) + (($record->pts ?? 0) * 0.1) + (($record->pas ?? 0) * 0.4);
                        return round($final);
                    })
                    ->color(fn ($state) => match(true) {
                        $state >= 77 => 'success',
                        default => 'danger',
                    }),
                TextColumn::make('updated_at')
                    ->label('Diperbarui')
                    ->dateTime('d M Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('classroom_id')
                    ->label('Kelas')
                    ->options(Classroom::pluck('name', 'id')),
                SelectFilter::make('subject_id')
                    ->label('Mata Pelajaran')
                    ->options(Subject::pluck('name', 'id')),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('classroom_id');
    }
}
