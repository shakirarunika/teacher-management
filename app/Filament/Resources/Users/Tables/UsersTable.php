<?php

namespace App\Filament\Resources\Users\Tables;

use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable(),
                TextColumn::make('email')
                    ->label('Email address')
                    ->searchable(),
                TextColumn::make('role')
                    ->badge(),
                TextColumn::make('status')
                    ->label('Status Akses')
                    ->badge()
                    ->state(fn ($record) => $record->hasActiveAccess() ? 'Aktif' : 'Nonaktif')
                    ->color(fn (string $state): string => $state === 'Aktif' ? 'success' : 'danger'),
                TextColumn::make('subscription_ends_at')
                    ->label('Langganan s/d')
                    ->dateTime('d M Y')
                    ->placeholder('—')
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                Action::make('activate')
                    ->label('Aktifkan 1 Tahun')
                    ->icon('heroicon-m-check-badge')
                    ->color('success')
                    ->visible(fn ($record): bool => $record->role === 'teacher')
                    ->requiresConfirmation()
                    ->modalHeading('Aktifkan langganan guru')
                    ->modalDescription(fn ($record) => "Aktifkan akun {$record->name} selama 1 tahun ke depan?")
                    ->action(fn ($record) => $record->update([
                        'subscription_ends_at' => now()->addYear(),
                    ])),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
