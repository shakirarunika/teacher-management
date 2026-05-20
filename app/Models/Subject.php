<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $guarded = [];

    public function scores()
    {
        return $this->hasMany(Score::class);
    }
}
