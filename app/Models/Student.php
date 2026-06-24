<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory, BelongsToOwner;

    protected $guarded = [];

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
