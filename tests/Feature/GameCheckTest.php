<?php

namespace Tests\Feature;

use App\Models\BankQuestion;
use App\Models\Game;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameCheckTest extends TestCase
{
    use RefreshDatabase;

    private function makeGame(User $teacher, string $answerKey): array
    {
        $this->actingAs($teacher);

        $subject = Subject::create(['name' => 'Matematika']); // user_id diisi hook BelongsToOwner
        $question = BankQuestion::create([
            'subject_id' => $subject->id,
            'type' => 'isian',
            'q' => 'Soal uji',
            'answer_text' => $answerKey,
        ]);
        $game = Game::create(['name' => 'Game Uji', 'token' => 'tokuji12', 'question_ids' => [$question->id], 'timer_seconds' => 30]);

        return [$game, $question];
    }

    private function makeTeacher(): User
    {
        return User::factory()->create(['role' => 'teacher', 'trial_ends_at' => now()->addWeek()]);
    }

    public function test_jawaban_benar_dengan_variasi_format(): void
    {
        [$game, $q] = $this->makeGame($this->makeTeacher(), 'x^3');

        // "X ^ {3}" (gaya LaTeX/MathLive) harus cocok dengan kunci "x^3"
        $this->postJson(route('games.check', $game->token), ['question_id' => $q->id, 'answer' => 'X ^ {3}'])
            ->assertJson(['correct' => true]);
    }

    public function test_alternatif_kunci_dipisah_pipe(): void
    {
        [$game, $q] = $this->makeGame($this->makeTeacher(), '0.5|1/2');

        $this->postJson(route('games.check', $game->token), ['question_id' => $q->id, 'answer' => '1/2'])
            ->assertJson(['correct' => true]);
    }

    public function test_jawaban_salah(): void
    {
        [$game, $q] = $this->makeGame($this->makeTeacher(), '94');

        $this->postJson(route('games.check', $game->token), ['question_id' => $q->id, 'answer' => '90'])
            ->assertJson(['correct' => false]);
    }

    public function test_reveal_mengembalikan_kunci_pertama(): void
    {
        [$game, $q] = $this->makeGame($this->makeTeacher(), '0.5|1/2');

        $this->postJson(route('games.reveal', $game->token), ['question_id' => $q->id])
            ->assertJson(['answer' => '0.5']);
    }

    public function test_soal_di_luar_game_ditolak(): void
    {
        [$game] = $this->makeGame($this->makeTeacher(), '94');

        $this->postJson(route('games.check', $game->token), ['question_id' => 999999, 'answer' => '94'])
            ->assertNotFound();
    }

    public function test_token_salah_404(): void
    {
        [, $q] = $this->makeGame($this->makeTeacher(), '94');

        $this->postJson(route('games.check', 'tokensalah'), ['question_id' => $q->id, 'answer' => '94'])
            ->assertNotFound();
    }

    public function test_main_tanpa_login_bisa(): void
    {
        [$game, $q] = $this->makeGame($this->makeTeacher(), '94');

        // Laptop yang dipegang siswa tidak login — token cukup untuk main
        $this->post('/logout');
        $this->assertGuest();

        $this->get(route('games.play', $game->token))->assertOk();
        $this->postJson(route('games.check', $game->token), ['question_id' => $q->id, 'answer' => '94'])
            ->assertJson(['correct' => true]);
    }
}
