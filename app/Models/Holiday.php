<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    use HasFactory, BelongsToOwner;

    protected $fillable = [
        'date',
        'name',
        'type',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];
}
