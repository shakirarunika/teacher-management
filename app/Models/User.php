<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role', 'trial_ends_at', 'subscription_ends_at', 'weight_kehadiran', 'weight_tugas', 'weight_pts', 'weight_pas'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'trial_ends_at' => 'datetime',
            'subscription_ends_at' => 'datetime',
            'weight_kehadiran' => 'integer',
            'weight_tugas' => 'integer',
            'weight_pts' => 'integer',
            'weight_pas' => 'integer',
        ];
    }

    /** Bobot penilaian guru (persen). Default 30/20/10/40 jika belum diset. */
    public function gradingWeights(): array
    {
        return [
            'kehadiran' => $this->weight_kehadiran ?? 30,
            'tugas' => $this->weight_tugas ?? 20,
            'pts' => $this->weight_pts ?? 10,
            'pas' => $this->weight_pas ?? 40,
        ];
    }

    public function classrooms()
    {
        return $this->hasMany(Classroom::class, 'teacher_id');
    }

    /**
     * Apakah guru masih boleh mengakses aplikasi: trial belum habis atau
     * langganan masih aktif. Admin selalu boleh.
     */
    public function hasActiveAccess(): bool
    {
        if ($this->role === 'admin') {
            return true;
        }

        return (bool) ($this->trial_ends_at?->isFuture() || $this->subscription_ends_at?->isFuture());
    }

    /**
     * Tentukan apakah user boleh akses Filament admin panel.
     * Hanya user dengan role 'admin' yang diizinkan.
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->role === 'admin';
    }
}
