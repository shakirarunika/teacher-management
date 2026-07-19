<?php

namespace Tests\Feature;

use App\Models\BankQuestion;
use App\Models\Classroom;
use App\Models\Game;
use App\Models\Quiz;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Link publik (token) ikut mati saat langganan guru pemiliknya habis —
 * fitur tidak bisa dipakai lewat URL tanpa langganan aktif.
 */
class SubscriptionGateTest extends TestCase
{
    use RefreshDatabase;

    private function makeExpiredTeacher(): User
    {
        return User::factory()->create(['role' => 'teacher', 'trial_ends_at' => now()->subDay()]);
    }

    public function test_game_guru_kedaluwarsa_tidak_bisa_dimainkan(): void
    {
        $teacher = $this->makeExpiredTeacher();
        $subject = Subject::create(['name' => 'MTK', 'user_id' => $teacher->id]);
        $q = BankQuestion::create([
            'user_id' => $teacher->id, 'subject_id' => $subject->id,
            'type' => 'isian', 'q' => 'Soal', 'answer_text' => '1',
        ]);
        $game = Game::create([
            'user_id' => $teacher->id, 'name' => 'G', 'token' => 'gexpired',
            'question_ids' => [$q->id], 'timer_seconds' => 30,
        ]);

        $this->get(route('games.play', $game->token))->assertForbidden();
        $this->postJson(route('games.check', $game->token), ['question_id' => $q->id, 'answer' => '1'])
            ->assertForbidden();
    }

    public function test_kuis_guru_kedaluwarsa_tertutup(): void
    {
        $teacher = $this->makeExpiredTeacher();
        $classroom = Classroom::create(['name' => 'X', 'teacher_id' => $teacher->id, 'user_id' => $teacher->id]);
        $subject = Subject::create(['name' => 'MTK', 'user_id' => $teacher->id]);
        $quiz = Quiz::create([
            'user_id' => $teacher->id, 'classroom_id' => $classroom->id, 'subject_id' => $subject->id,
            'title' => 'Q', 'token' => 'qexpired', 'is_open' => true,
            'questions' => [['q' => '1+1?', 'options' => ['1', '2'], 'answer' => 1]],
        ]);

        // Halaman kuis tampil sebagai tertutup, soal tidak dikirim
        $this->get(route('quiz.take', $quiz->token))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('quiz.closed_reason', 'closed')
                ->where('quiz.questions', []));

        // Submit ditolak
        $this->post(route('quiz.submit', $quiz->token), [
            'student_id' => 1, 'answers' => [1],
        ])->assertSessionHas('error');
    }
}
