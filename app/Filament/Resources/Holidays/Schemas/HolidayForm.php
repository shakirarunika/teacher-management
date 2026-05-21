<?php

namespace App\Filament\Resources\Holidays\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class HolidayForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                DatePicker::make('date')
                    ->label('Tanggal')
                    ->required()
                    ->unique(ignoreRecord: true),

                TextInput::make('name')
                    ->label('Nama Hari Libur')
                    ->required()
                    ->maxLength(255),

                Select::make('type')
                    ->label('Jenis')
                    ->options([
                        'Nasional' => 'Nasional',
                        'Internal' => 'Internal',
                    ])
                    ->required(),
            ]);
    }
}
