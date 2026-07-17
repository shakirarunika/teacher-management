<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Halaman kuis untuk siswa — tanpa login, akses via token acak di link.
 * OwnerScope tidak aktif untuk guest, jadi query di sini lintas tenant by design.
 */
class PublicQuizController extends Controller
{
    public function show(string $token)
    {
        $quiz = Quiz::where('token', $token)->firstOrFail();
        $closedReason = $quiz->closedReason();

        // Soal dikirim dengan index aslinya (i) supaya jawaban tetap cocok
        // dengan kunci walau urutan soal/pilihan diacak per siswa.
        $questions = [];
        if (!$closedReason) {
            foreach ($quiz->questions as $i => $q) {
                $type = $q['type'] ?? 'pg';
                $item = [
                    'i' => $i,
                    'type' => $type,
                    'q' => $q['q'],
                    'stimulus' => $q['stimulus'] ?? null,
                    'media' => $q['media'] ?? null,
                ];
                if ($type === 'pg') {
                    $options = array_map(
                        fn ($j) => ['i' => $j, 'text' => $q['options'][$j]],
                        array_keys($q['options'])
                    );
                    if ($quiz->shuffle_options) shuffle($options);
                    $item['options'] = $options;
                } elseif ($type === 'jodoh') {
                    $item['lefts'] = array_column($q['pairs'], 'left');
                    $rights = array_map(
                        fn ($k) => ['i' => $k, 'text' => $q['pairs'][$k]['right']],
                        array_keys($q['pairs'])
                    );
                    shuffle($rights); // selalu diacak — urutan asli = kunci jawaban
                    $item['rights'] = $rights;
                }
                // isian & esai: cukup pertanyaannya saja
                $questions[] = $item;
            }
            if ($quiz->shuffle_questions) shuffle($questions);
        }

        return Inertia::render('Quizzes/Take', [
            'quiz' => [
                'token' => $quiz->token,
                'title' => $quiz->title,
                'classroom' => $quiz->classroom->name,
                'subject' => $quiz->subject->name,
                'duration_minutes' => $quiz->duration_minutes,
                'show_result' => $quiz->show_result,
                'total_questions' => count($quiz->questions),
                'closed_reason' => $closedReason,
                'opens_at' => $quiz->opens_at,
                'closes_at' => $quiz->closes_at,
                // Kunci jawaban sengaja TIDAK ikut dikirim ke browser
                'questions' => $questions,
            ],
            'students' => $closedReason ? [] : $quiz->classroom->students()->orderBy('name')->get(['students.id', 'name']),
            'doneStudentIds' => $quiz->attempts()->pluck('student_id'),
        ]);
    }

    public function submit(Request $request, string $token)
    {
        $quiz = Quiz::where('token', $token)->firstOrFail();

        if ($reason = $quiz->closedReason()) {
            return back()->with('error', [
                'closed' => 'Kuis sudah ditutup oleh guru.',
                'not_open_yet' => 'Kuis belum dibuka.',
                'ended' => 'Waktu pengerjaan sudah berakhir.',
            ][$reason]);
        }

        $validated = $request->validate([
            'student_id' => 'required|integer',
            // Jawaban diindeks sesuai urutan soal ASLI; null = tidak dijawab
            // (bisa terjadi saat waktu habis dan auto-submit).
            'answers' => 'required|array|size:' . count($quiz->questions),
            'answers.*' => 'nullable', // bentuk tergantung tipe soal, disanitasi di bawah
            'duration_seconds' => 'nullable|integer|min:0',
        ]);

        // Siswa harus anggota kelas kuis ini
        if (!$quiz->classroom->students()->where('students.id', $validated['student_id'])->exists()) {
            abort(403, 'Siswa tidak terdaftar di kelas ini.');
        }

        if ($quiz->attempts()->where('student_id', $validated['student_id'])->exists()) {
            return back()->with('error', 'Kamu sudah mengerjakan kuis ini.');
        }

        // Sanitasi jawaban per tipe soal sebelum disimpan & dinilai
        $answers = [];
        foreach ($quiz->questions as $i => $q) {
            $raw = $validated['answers'][$i] ?? null;
            $answers[$i] = match (true) {
                $raw === null => null,
                ($q['type'] ?? 'pg') === 'jodoh' => is_array($raw)
                    ? array_map(fn ($v) => $v === null ? null : (int) $v, array_slice($raw, 0, count($q['pairs'])))
                    : null,
                in_array($q['type'] ?? 'pg', ['isian', 'esai'], true) => is_string($raw) ? mb_substr($raw, 0, 5000) : null,
                default => is_numeric($raw) ? (int) $raw : null,
            };
        }

        // Penilaian di server, kunci tidak pernah menyentuh browser
        $graded = $quiz->gradeAnswers($answers);
        $score = $graded['score'];
        $review = $graded['review'];
        $correct = count(array_filter($review, fn ($r) => !empty($r['correct'])));
        $total = count($quiz->questions);

        // ponytail: durasi dilaporkan client, di-clamp ke batas wajar.
        // Enforcement timer ketat butuh pencatatan mulai di server — nanti kalau perlu.
        $maxDuration = $quiz->duration_minutes ? $quiz->duration_minutes * 60 + 60 : 86400;
        $duration = min($validated['duration_seconds'] ?? 0, $maxDuration);

        $quiz->attempts()->create([
            'student_id' => $validated['student_id'],
            'answers' => array_values($answers),
            'score' => $score,
            'duration_seconds' => $duration ?: null,
        ]);

        // Mode ujian: skor & review disembunyikan dari siswa
        if (!$quiz->show_result) {
            return back()->with('quiz_result', ['submitted' => true, 'show_result' => false]);
        }

        return back()->with('quiz_result', [
            'submitted' => true,
            'show_result' => true,
            'score' => $score,
            'correct' => $correct,
            'total' => $total,
            'pending_essays' => $graded['pending_essays'],
            'review' => $review,
        ]);
    }
}
