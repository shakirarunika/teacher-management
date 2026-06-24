<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory, BelongsToOwner;

    protected $guarded = [];

    /**
     * Generate NIS otomatis: TAHUN + 4 digit urutan (mis. 20260001).
     * Urutan dihitung per guru karena NIS unik per guru (OwnerScope aktif).
     */
    public static function generateNis(): string
    {
        $prefix = date('Y');
        $last = static::where('nis', 'like', $prefix . '%')
            ->orderByRaw('CAST(nis AS UNSIGNED) DESC')
            ->first();
        $next = $last ? ((int) substr($last->nis, strlen($prefix))) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function classrooms()
    {
        return $this->belongsToMany(Classroom::class, 'classroom_student')
                    ->withPivot('academic_year_id')
                    ->withTimestamps();
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function scores()
    {
        return $this->hasMany(Score::class);
    }
}
