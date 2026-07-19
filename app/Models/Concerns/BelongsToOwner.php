<?php

namespace App\Models\Concerns;

use App\Models\Scopes\OwnerScope;

/**
 * Tandai model sebagai milik seorang guru (tenant).
 * Otomatis: filter query per guru (OwnerScope) + isi kolom pemilik saat create.
 * Model dengan nama kolom pemilik berbeda cukup override ownerColumn().
 */
trait BelongsToOwner
{
    public static function bootBelongsToOwner(): void
    {
        static::addGlobalScope(new OwnerScope);

        static::creating(function ($model) {
            $user = auth()->user();
            $column = $model->ownerColumn();

            // Otoritatif: dalam konteks guru, pemilik SELALU dipaksa ke id guru
            // yang login, mengabaikan nilai apa pun yang dikirim (anti hijack).
            // Konteks admin/CLI/seeder (tanpa guru login) memakai nilai eksplisit.
            if ($user && $user->role === 'teacher') {
                $model->{$column} = $user->id;
            }
        });
    }

    public function ownerColumn(): string
    {
        return 'user_id';
    }

    /** Guru pemilik data — dipakai antara lain untuk cek langganan di halaman publik. */
    public function owner()
    {
        return $this->belongsTo(\App\Models\User::class, $this->ownerColumn());
    }
}
