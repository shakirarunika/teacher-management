<?php

namespace App\Filament\Resources\Classrooms\Schemas;

use App\Models\User;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class ClassroomForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->label('Nama Kelas')
                    ->required()
                    ->placeholder('Contoh: XI TKJ A'),
                Select::make('teacher_id')
                    ->label('Guru Pengampu')
                    ->options(User::where('role', 'teacher')->pluck('name', 'id'))
                    ->searchable()
                    ->required(),
            ]);
    }
}
