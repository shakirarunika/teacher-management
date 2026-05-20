<?php

namespace App\Filament\Resources\Attendances\Tables;

use App\Models\Classroom;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class AttendancesTable
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
                TextColumn::make('date')
                    ->label('Tanggal')
                    ->date('d M Y')
                    ->sortable(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'Hadir' => 'success',
                        'Sakit' => 'warning',
                        'Izin'  => 'info',
                        'Alpha' => 'danger',
                        default => 'gray',
                    }),
            ])
            ->filters([
                SelectFilter::make('classroom_id')
                    ->label('Kelas')
                    ->options(Classroom::orderBy('name')->pluck('name', 'id')),
                SelectFilter::make('status')
                    ->label('Status')
                    ->options([
                        'Hadir' => 'Hadir',
                        'Sakit' => 'Sakit',
                        'Izin'  => 'Izin',
                        'Alpha' => 'Alpha',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('date', 'desc');
    }
}
