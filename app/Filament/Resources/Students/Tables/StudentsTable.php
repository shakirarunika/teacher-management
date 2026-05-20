<?php

namespace App\Filament\Resources\Students\Tables;

use App\Models\Classroom;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class StudentsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nis')
                    ->label('NIS')
                    ->searchable()
                    ->copyable()
                    ->fontFamily('mono'),
                TextColumn::make('name')
                    ->label('Nama Siswa')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('classrooms.name')
                    ->label('Kelas')
                    ->badge()
                    ->color('primary')
                    ->separator(', '),
                TextColumn::make('gender')
                    ->label('L/P')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'L' => 'info',
                        'P' => 'pink',
                        default => 'gray',
                    })
                    ->alignCenter(),
                TextColumn::make('date_of_birth')
                    ->label('Tgl. Lahir')
                    ->date('d M Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('classrooms')
                    ->label('Kelas')
                    ->relationship('classrooms', 'name')
                    ->searchable()
                    ->preload(),
                SelectFilter::make('gender')
                    ->label('Jenis Kelamin')
                    ->options(['L' => 'Laki-laki', 'P' => 'Perempuan']),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('name');
    }
}
