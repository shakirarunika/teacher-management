<?php

namespace App\Filament\Resources\Attendances\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class AttendanceForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('classroom_id')
                    ->required()
                    ->numeric(),
                TextInput::make('student_id')
                    ->required()
                    ->numeric(),
                DatePicker::make('date')
                    ->required(),
                Select::make('status')
                    ->options(['Hadir' => 'Hadir', 'Sakit' => 'Sakit', 'Izin' => 'Izin', 'Alpha' => 'Alpha'])
                    ->required(),
            ]);
    }
}
