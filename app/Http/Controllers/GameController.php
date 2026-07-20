<?php

namespace App\Http\Controllers;

use App\Models\BankQuestion;
use App\Models\Game;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Game "Extreme Answer" — satu layar di proyektor, siswa maju mengetik jawaban.
 * Kelola game butuh login guru; halaman main diakses via token acak TANPA sesi
 * (biar laptop yang dipegang siswa tidak membawa akun guru). Kunci tidak pernah
 * dikirim ke browser, pengecekan lewat endpoint check.
 */
class GameController extends Controller
{
    // OwnerScope membatasi listing/kelola ke milik guru yang login.

    public function index()
    {
        return Inertia::render('Games/Index', [
            'games' => Game::latest()->get(),
            // Picker hanya butuh tipe isian (jawaban diketik) — PG dkk tidak cocok untuk game ini
            'questions' => BankQuestion::where('type', 'isian')
                ->with('subject:id,name')->latest()
                ->get(['id', 'subject_id', 'materi', 'difficulty', 'q']),
            'subjects' => Subject::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        // ponytail: token acak 8 char = gate akses link main. Sama seperti kuis publik.
        Game::create($this->validateGame($request) + ['token' => Str::lower(Str::random(8))]);

        return back()->with('success', 'Game berhasil dibuat!');
    }

    public function update(Request $request, Game $game)
    {
        $game->update($this->validateGame($request));

        return back()->with('success', 'Game berhasil diperbarui!');
    }

    public function destroy(Game $game)
    {
        $game->delete();

        return back()->with('success', 'Game dihapus.');
    }

    public function play(string $token)
    {
        $game = $this->gameByToken($token);

        return Inertia::render('Games/Play', [
            'game' => $game->only(['id', 'name', 'token', 'timer_seconds']),
            // Kunci jawaban sengaja tidak ikut — layar ini tampil di proyektor
            'questions' => $game->questions()->map(fn ($q) => [
                'id' => $q->id,
                'q' => $q->q,
                'stimulus' => $q->stimulus,
                'media' => $q->media,
            ]),
        ]);
    }

    /** Cek jawaban satu soal. Return {correct: bool} — kunci tetap di server. */
    public function check(Request $request, string $token)
    {
        $validated = $request->validate([
            'question_id' => 'required|integer',
            'answer' => 'required|string|max:1000',
        ]);
        $q = $this->questionOrFail($this->gameByToken($token), $validated['question_id']);

        $keys = array_map([$this, 'normalize'], explode('|', (string) $q->answer_text));
        $ans = $this->normalize($validated['answer']);

        return response()->json(['correct' => $ans !== '' && in_array($ans, $keys, true)]);
    }

    /** Kunci jawaban untuk ditampilkan saat waktu habis / guru skip. */
    public function reveal(Request $request, string $token)
    {
        $validated = $request->validate(['question_id' => 'required|integer']);
        $q = $this->questionOrFail($this->gameByToken($token), $validated['question_id']);

        return response()->json(['answer' => trim(explode('|', (string) $q->answer_text)[0])]);
    }

    /** Token = kapabilitas akses main — lewati OwnerScope supaya jalan di device tanpa login. */
    private function gameByToken(string $token): Game
    {
        $game = Game::withoutGlobalScopes()->where('token', $token)->firstOrFail();

        // Langganan guru habis → link game ikut mati (tidak bisa bypass via URL)
        abort_unless($game->owner?->hasActiveAccess(), 403, 'Langganan pemilik game sudah berakhir.');

        return $game;
    }

    private function questionOrFail(Game $game, int $questionId): BankQuestion
    {
        // Keanggotaan di game (yang tokennya sudah tervalidasi) = otorisasi soal
        abort_unless(in_array($questionId, $game->question_ids, true), 404);

        return BankQuestion::withoutGlobalScopes()->findOrFail($questionId);
    }

    /**
     * Samakan jawaban siswa (ascii-math dari MathLive) dengan kunci guru (teks bebas):
     * lowercase, buang spasi/kurung kurawal/simbol dekorasi LaTeX.
     * ponytail: pencocokan string, bukan kesetaraan matematis — 0.5 vs 1/2 dianggap
     * beda kecuali guru menambah alternatif kunci dengan "|". Upgrade: Compute Engine.
     */
    private function normalize(string $s): string
    {
        $s = mb_strtolower(trim($s));
        $s = str_replace(['\\left', '\\right', '\\,', '{', '}', '$', '\\'], '', $s);

        return preg_replace('/\s+/u', '', $s);
    }

    private function validateGame(Request $request): array
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'timer_seconds' => 'required|integer|min:0|max:3600', // 0 = tanpa batas waktu
            'question_ids' => 'required|array|min:1|max:100',
            'question_ids.*' => [
                'required', 'integer', 'distinct',
                Rule::exists('bank_questions', 'id')->where('user_id', $request->user()->id)->where('type', 'isian'),
            ],
        ]);

        return $validated;
    }
}
