<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    use BelongsToOwner;

    protected $guarded = ['id'];

    public function students()
    {
        return $this->belongsToMany(Student::class, 'classroom_student');
    }
}
