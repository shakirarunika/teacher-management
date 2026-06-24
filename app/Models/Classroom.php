<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classroom extends Model
{
    use HasFactory, BelongsToOwner;

    protected $guarded = [];

    public function ownerColumn(): string
    {
        return 'teacher_id';
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'classroom_student')
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
