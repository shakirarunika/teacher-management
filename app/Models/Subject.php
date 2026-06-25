<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use BelongsToOwner;

    protected $guarded = ['id'];

    public function scores()
    {
        return $this->hasMany(Score::class);
    }
}
