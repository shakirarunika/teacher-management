<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    use HasFactory, BelongsToOwner;

    protected $guarded = ['id'];

    protected $casts = [
        'questions' => 'array',
        'is_open' => 'boolean',
        'opens_at' => 'datetime',
        'closes_at' => 'datetime',
        'shuffle_questions' => 'boolean',
        'shuffle_options' => 'boolean',
        'show_result' => 'boolean',
    ];

    /**
     * Kuis bisa dikerjakan: toggle manual terbuka DAN dalam jendela jadwal.
     * Return kode alasan ('closed'|'not_open_yet'|'ended') — pesan + format
     * waktu dirakit di client sesuai zona waktu browser siswa.
     */
    public function closedReason(): ?string
    {
        if (!$this->is_open) return 'closed';
        if ($this->opens_at && now()->lt($this->opens_at)) return 'not_open_yet';
        if ($this->closes_at && now()->gt($this->closes_at)) return 'ended';

        return null;
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }
}
