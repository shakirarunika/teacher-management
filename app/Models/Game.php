<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use BelongsToOwner;

    protected $guarded = ['id'];

    protected $casts = [
        'question_ids' => 'array',
        'timer_seconds' => 'integer',
    ];

    /** Soal game sesuai urutan question_ids; soal yang sudah dihapus dari bank dilewati. */
    public function questions()
    {
        $byId = BankQuestion::whereIn('id', $this->question_ids)->get()->keyBy('id');

        return collect($this->question_ids)->map(fn ($id) => $byId->get($id))->filter()->values();
    }
}
