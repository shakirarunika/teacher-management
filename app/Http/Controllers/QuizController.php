<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Score;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class QuizController extends Controller
{
    // OwnerScope membatasi {classroom} & {quiz} ke milik guru yang login.

    public function index(Request $request, Classroom $classroom)
    {
        return Inertia::render('Quizzes/Index', [
            'classroom' => $classroom->only(['id', 'name']),
            'quizzes' => $classroom->quizzes()
                ->with('subject:id,name')
                ->withCount('attempts')
                ->latest()
                ->get(),
            'subjects' => Subject::orderBy('name')->get(['id', 'name']),
            'studentsCount' => $classroom->students()->count(),
        ]);
    }

    public function store(Request $request, Classroom $classroom)
    {
        $validated = $this->validateQuiz($request);

        // ponytail: token acak 8 char = gate akses link publik. Tabrakan praktis
        // mustahil, unique index jadi jaring pengaman terakhir.
        Quiz::create([
            ...$validated,
            'classroom_id' => $classroom->id,
            'token' => Str::lower(Str::random(8)),
        ]);

        return back()->with('success', 'Kuis berhasil dibuat! Salin link dan bagikan ke siswa.');
    }

    public function update(Request $request, Quiz $quiz)
    {
        // Toggle buka/tutup saja
        if ($request->has('is_open') && count($request->all()) === 1) {
            $quiz->update($request->validate(['is_open' => 'required|boolean']));

            return back()->with('success', $quiz->is_open ? 'Kuis dibuka.' : 'Kuis ditutup.');
        }

        $validated = $this->validateQuiz($request);

        // Soal terkunci begitu ada pengerjaan (biar jawaban lama tidak salah
        // nilai), tapi judul & pengaturan (jadwal, timer, dll) tetap bisa diubah.
        if ($quiz->attempts()->exists()) {
            unset($validated['questions']);
        }

        $quiz->update($validated);

        return back()->with('success', 'Kuis berhasil diperbarui!');
    }

    public function duplicate(Quiz $quiz)
    {
        $copy = $quiz->replicate();
        $copy->title = $quiz->title . ' (salinan)';
        $copy->token = Str::lower(Str::random(8));
        $copy->is_open = false; // guru review dulu sebelum dibagikan
        $copy->save();

        return back()->with('success', 'Kuis berhasil diduplikat (status: ditutup).');
    }

    public function destroy(Quiz $quiz)
    {
        $quiz->delete();

        return back()->with('success', 'Kuis berhasil dihapus.');
    }

    public function results(Request $request, Quiz $quiz)
    {
        $attempts = $quiz->attempts()->with('student:id,name')->orderByDesc('score')->get();

        // Statistik per soal, bentuknya tergantung tipe soal
        $stats = array_map(function ($q) {
            $type = $q['type'] ?? 'pg';
            $base = ['type' => $type, 'q' => $q['q'], 'correct' => 0];

            return match ($type) {
                'pg' => $base + [
                    'options' => $q['options'],
                    'answer' => (int) $q['answer'],
                    'picks' => array_fill(0, count($q['options']), 0),
                ],
                'pgk' => $base + [
                    'options' => $q['options'],
                    'answer' => array_map('intval', (array) $q['answer']),
                    'picks' => array_fill(0, count($q['options']), 0),
                ],
                'isian' => $base + ['answer' => trim(explode('|', (string) $q['answer'])[0]), 'wrong' => []],
                'jodoh' => $base + ['pairsTotal' => count($q['pairs']), 'matchedSum' => 0],
                default => $base, // soal esai lama (tipe sudah dihapus)
            };
        }, $quiz->questions);

        foreach ($attempts as $attempt) {
            $graded = $quiz->gradeAnswers($attempt->answers);

            foreach ($quiz->questions as $i => $q) {
                $type = $q['type'] ?? 'pg';
                $ans = $attempt->answers[$i] ?? null;
                if (!empty($graded['review'][$i]['correct'])) {
                    $stats[$i]['correct']++;
                }
                if ($type === 'pg' && $ans !== null && isset($stats[$i]['picks'][$ans])) {
                    $stats[$i]['picks'][$ans]++;
                } elseif ($type === 'pgk' && is_array($ans)) {
                    foreach ($ans as $p) {
                        if (isset($stats[$i]['picks'][$p])) $stats[$i]['picks'][$p]++;
                    }
                } elseif ($type === 'isian' && empty($graded['review'][$i]['correct']) && is_string($ans) && trim($ans) !== '') {
                    $key = trim($ans);
                    $stats[$i]['wrong'][$key] = ($stats[$i]['wrong'][$key] ?? 0) + 1;
                } elseif ($type === 'jodoh') {
                    $stats[$i]['matchedSum'] += $graded['review'][$i]['matched'];
                }
            }
        }

        return Inertia::render('Quizzes/Results', [
            'quiz' => $quiz->only(['id', 'title', 'token', 'is_open', 'show_result', 'duration_minutes']),
            'classroom' => $quiz->classroom->only(['id', 'name']),
            'subject' => $quiz->subject->only(['id', 'name']),
            'attempts' => $attempts,
            'questionStats' => $stats,
            'kkm' => $request->user()->gradingWeights()['kkm'],
            'studentsNotDone' => $quiz->classroom->students()
                ->whereNotIn('students.id', $attempts->pluck('student_id'))
                ->orderBy('name')
                ->get(['students.id', 'name']),
        ]);
    }

    /**
     * Hapus pengerjaan siswa — misal salah pilih nama atau dijahili teman.
     * Siswa tsb bisa mengerjakan ulang dari awal.
     */
    public function destroyAttempt(Quiz $quiz, QuizAttempt $attempt)
    {
        // {quiz} sudah ter-OwnerScope; pastikan attempt memang milik kuis ini.
        abort_unless($attempt->quiz_id === $quiz->id, 404);

        $attempt->delete();

        return back()->with('success', 'Pengerjaan dihapus. Siswa bisa mengerjakan ulang.');
    }

    /**
     * Salin skor kuis ke rekap nilai (kolom tugas/pts/pas) — nyambung ke
     * halaman Nilai & bobot yang sudah ada.
     */
    public function copyScores(Request $request, Quiz $quiz)
    {
        $validated = $request->validate([
            'column' => ['required', Rule::in(['tugas', 'pts', 'pas'])],
        ]);

        foreach ($quiz->attempts as $attempt) {
            Score::updateOrCreate(
                [
                    'classroom_id' => $quiz->classroom_id,
                    'student_id' => $attempt->student_id,
                    'subject_id' => $quiz->subject_id,
                ],
                [$validated['column'] => $attempt->score]
            );
        }

        return back()->with('success', "Skor kuis disalin ke kolom {$validated['column']}!");
    }

    /**
     * Upload media soal (gambar/audio) ke disk public.
     * ponytail: file yatim (soal dihapus/diganti) dibiarkan menumpuk dulu;
     * bikin pembersih terjadwal kalau storage jadi masalah.
     */
    public function uploadMedia(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,webp,gif,mp3,m4a,ogg,wav,aac|max:10240',
        ]);

        $file = $request->file('file');
        $isImage = str_starts_with($file->getMimeType(), 'image/');

        if ($isImage && $file->getSize() > 2 * 1024 * 1024) {
            return response()->json(['message' => 'Gambar maksimal 2MB.'], 422);
        }

        $path = $file->store('quiz-media', 'public');

        return response()->json([
            'url' => \Illuminate\Support\Facades\Storage::url($path),
            'type' => $isImage ? 'image' : 'audio',
        ]);
    }

    private function validateQuiz(Request $request): array
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subject_id' => ['required', Rule::exists('subjects', 'id')->where('user_id', $request->user()->id)],
            'questions' => 'required|array|min:1|max:100',
            'questions.*.q' => 'required|string|max:1000',
            'questions.*.stimulus' => 'nullable|string|max:5000',
            'questions.*.media' => 'nullable|array',
            'questions.*.media.type' => 'required_with:questions.*.media|in:image,audio,youtube',
            'questions.*.media.url' => 'required_with:questions.*.media|string|max:1000',
            'questions.*.type' => 'nullable|in:pg,pgk,isian,jodoh',
            'questions.*.options' => 'nullable|array|max:5',
            'questions.*.options.*' => 'required|string|max:500',
            'questions.*.answer' => 'nullable', // int (pg), array index (pgk), atau string kunci (isian) — dicek per tipe di bawah
            'questions.*.pairs' => 'nullable|array|max:10',
            'questions.*.pairs.*.left' => 'required|string|max:500',
            'questions.*.pairs.*.right' => 'required|string|max:500',
            'duration_minutes' => 'nullable|integer|min:1|max:600',
            'opens_at' => 'nullable|date',
            'closes_at' => 'nullable|date',
            'shuffle_questions' => 'boolean',
            'shuffle_options' => 'boolean',
            'show_result' => 'boolean',
        ]);

        if (!empty($validated['opens_at']) && !empty($validated['closes_at'])
            && strtotime($validated['closes_at']) <= strtotime($validated['opens_at'])) {
            abort(422, 'Jadwal tutup harus setelah jadwal buka.');
        }

        foreach ($validated['questions'] as $i => $q) {
            $n = $i + 1;
            switch ($q['type'] ?? 'pg') {
                case 'isian':
                    if (!is_string($q['answer'] ?? null) || trim($q['answer']) === '' || mb_strlen($q['answer']) > 500) {
                        abort(422, "Soal {$n}: kunci jawaban isian wajib diisi.");
                    }
                    break;
                case 'jodoh':
                    if (count($q['pairs'] ?? []) < 2) {
                        abort(422, "Soal {$n}: menjodohkan minimal 2 pasangan.");
                    }
                    break;
                case 'pgk':
                    if (count($q['options'] ?? []) < 2) {
                        abort(422, "Soal {$n}: minimal 2 pilihan jawaban.");
                    }
                    $keys = is_array($q['answer'] ?? null) ? array_unique($q['answer']) : [];
                    $invalid = array_filter($keys, fn ($k) => !is_numeric($k) || $k < 0 || $k >= count($q['options']));
                    if ($keys === [] || $invalid !== []) {
                        abort(422, "Soal {$n}: centang minimal satu kunci jawaban yang valid.");
                    }
                    break;
                default: // pg
                    if (count($q['options'] ?? []) < 2) {
                        abort(422, "Soal {$n}: minimal 2 pilihan jawaban.");
                    }
                    if (!is_numeric($q['answer'] ?? null) || $q['answer'] < 0 || $q['answer'] >= count($q['options'])) {
                        abort(422, "Kunci jawaban soal {$n} tidak valid.");
                    }
            }
        }

        return $validated;
    }
}
