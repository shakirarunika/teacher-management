<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    protected $guarded = [];

    public function students()
    {
        return $this->belongsToMany(Student::class, 'classroom_student');
    }
}
