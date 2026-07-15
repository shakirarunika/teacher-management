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
                $options = array_map(
                    fn ($j) => ['i' => $j, 'text' => $q['options'][$j]],
                    array_keys($q['options'])
                );
                if ($quiz->shuffle_options) shuffle($options);
                $questions[] = [
                    'i' => $i,
                    'q' => $q['q'],
                    'stimulus' => $q['stimulus'] ?? null,
                    'media' => $q['media'] ?? null,
                    'options' => $options,
                ];
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
            'answers.*' => 'nullable|integer|min:0',
            'duration_seconds' => 'nullable|integer|min:0',
        ]);

        // Siswa harus anggota kelas kuis ini
        if (!$quiz->classroom->students()->where('students.id', $validated['student_id'])->exists()) {
            abort(403, 'Siswa tidak terdaftar di kelas ini.');
        }

        if ($quiz->attempts()->where('student_id', $validated['student_id'])->exists()) {
            return back()->with('error', 'Kamu sudah mengerjakan kuis ini.');
        }

        // Penilaian di server, kunci tidak pernah menyentuh browser
        $correct = 0;
        $review = [];
        foreach ($quiz->questions as $i => $q) {
            $picked = $validated['answers'][$i];
            $ok = $picked !== null && (int) $picked === (int) $q['answer'];
            if ($ok) $correct++;
            $review[] = ['correct' => $ok, 'answer' => (int) $q['answer']];
        }

        $total = count($quiz->questions);
        $score = (int) round($correct / $total * 100);

        // ponytail: durasi dilaporkan client, di-clamp ke batas wajar.
        // Enforcement timer ketat butuh pencatatan mulai di server — nanti kalau perlu.
        $maxDuration = $quiz->duration_minutes ? $quiz->duration_minutes * 60 + 60 : 86400;
        $duration = min($validated['duration_seconds'] ?? 0, $maxDuration);

        $quiz->attempts()->create([
            'student_id' => $validated['student_id'],
            'answers' => array_values($validated['answers']),
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
            'review' => $review,
        ]);
    }
}
