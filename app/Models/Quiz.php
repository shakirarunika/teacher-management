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

    /**
     * Penilaian di server — satu-satunya tempat logika skor.
     * Skor = rata-rata fraksi per soal: PG/PG kompleks/isian 0|1,
     * menjodohkan proporsional per pasangan.
     */
    public function gradeAnswers(array $answers): array
    {
        $earned = 0.0;
        $review = [];

        $norm = fn ($s) => mb_strtolower(trim(preg_replace('/\s+/u', ' ', (string) $s)));

        foreach ($this->questions as $i => $q) {
            $type = $q['type'] ?? 'pg';
            $ans = $answers[$i] ?? null;

            if ($type === 'pgk') {
                // Semua-atau-tidak: pilihan siswa harus persis sama dengan kunci
                // (parsial memancing centang semua pilihan)
                $key = array_map('intval', (array) $q['answer']);
                $picked = is_array($ans) ? array_map('intval', $ans) : [];
                sort($key);
                sort($picked);
                $ok = $picked !== [] && $picked === $key;
                if ($ok) $earned++;
                $review[] = ['type' => 'pgk', 'correct' => $ok, 'answer' => $key];
                continue;
            }

            if ($type === 'isian') {
                // Alternatif kunci dipisah "|", dibandingkan setelah normalisasi
                $keys = array_map($norm, explode('|', (string) $q['answer']));
                $ok = is_string($ans) && trim($ans) !== '' && in_array($norm($ans), $keys, true);
                if ($ok) $earned++;
                $review[] = ['type' => 'isian', 'correct' => $ok, 'answer' => trim(explode('|', (string) $q['answer'])[0])];
                continue;
            }

            if ($type === 'jodoh') {
                // Kunci: kiri ke-k berpasangan dengan kanan ke-k (index asli)
                $matched = 0;
                foreach (array_keys($q['pairs']) as $k) {
                    if (is_array($ans) && (int) ($ans[$k] ?? -1) === $k) $matched++;
                }
                $earned += $matched / count($q['pairs']);
                $review[] = [
                    'type' => 'jodoh',
                    'correct' => $matched === count($q['pairs']),
                    'matched' => $matched,
                    'total' => count($q['pairs']),
                    'pairs' => $q['pairs'],
                ];
                continue;
            }

            // ?? -1: soal esai lama (tipe sudah dihapus) tidak punya kunci — dinilai salah
            $ok = $ans !== null && $ans !== '' && is_numeric($ans) && (int) $ans === (int) ($q['answer'] ?? -1);
            if ($ok) $earned++;
            $review[] = ['type' => 'pg', 'correct' => $ok, 'answer' => (int) ($q['answer'] ?? -1)];
        }

        $total = count($this->questions);

        return [
            'score' => $total > 0 ? (int) round($earned / $total * 100) : 0,
            'review' => $review,
        ];
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
