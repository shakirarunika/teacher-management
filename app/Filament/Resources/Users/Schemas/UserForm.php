<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required(),
                DateTimePicker::make('email_verified_at')
                    ->label('Email terverifikasi pada')
                    ->default(now())
                    ->helperText('Akun buatan admin langsung terverifikasi. Kosongkan hanya jika ingin memaksa verifikasi email (butuh SMTP).'),
                TextInput::make('password')
                    ->password()
                    // Wajib hanya saat membuat user; saat edit, kosongkan jika tak ingin mengubah
                    ->required(fn (string $operation): bool => $operation === 'create')
                    ->dehydrated(fn (?string $state): bool => filled($state)),
                Select::make('role')
                    ->options(['admin' => 'Admin', 'teacher' => 'Teacher'])
                    ->default('teacher')
                    ->required(),
                DateTimePicker::make('trial_ends_at')
                    ->label('Masa coba s/d')
                    ->helperText('Kosongkan jika tidak memakai masa coba.'),
                DateTimePicker::make('subscription_ends_at')
                    ->label('Langganan aktif s/d')
                    ->helperText('Set tanggal di masa depan untuk mengaktifkan akun guru.'),
            ]);
    }
}
