<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Quiz;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizAttemptDeleteTest extends TestCase
{
    use RefreshDatabase;

    private function makeQuizWithAttempt(User $teacher): array
    {
        $this->actingAs($teacher);

        AcademicYear::create(['name' => '2026/2027', 'is_active' => true, 'user_id' => $teacher->id]);
        $classroom = Classroom::create(['name' => 'Kelas 10A', 'teacher_id' => $teacher->id, 'user_id' => $teacher->id]);
        $subject = Subject::create(['name' => 'Matematika']); // user_id diisi hook BelongsToOwner
        $student = Student::create(['name' => 'Budi', 'gender' => 'L', 'nis' => (string) $teacher->id, 'user_id' => $teacher->id]);
        $classroom->students()->attach($student);

        $quiz = Quiz::create([
            'title' => 'Ulangan 1',
            'classroom_id' => $classroom->id,
            'subject_id' => $subject->id,
            'token' => 'abcd1234',
            'questions' => [['q' => '1+1?', 'options' => ['1', '2'], 'answer' => 1]],
        ]);
        $attempt = $quiz->attempts()->create(['student_id' => $student->id, 'answers' => [1], 'score' => 100]);

        return [$quiz, $attempt];
    }

    private function makeTeacher(): User
    {
        return User::factory()->create(['role' => 'teacher', 'trial_ends_at' => now()->addWeek()]);
    }

    public function test_guru_bisa_hapus_pengerjaan_siswanya(): void
    {
        [$quiz, $attempt] = $this->makeQuizWithAttempt($this->makeTeacher());

        $this->delete(route('quizzes.attempts.destroy', [$quiz, $attempt]))
            ->assertRedirect();

        $this->assertDatabaseMissing('quiz_attempts', ['id' => $attempt->id]);
    }

    public function test_guru_lain_tidak_bisa_hapus_pengerjaan(): void
    {
        [$quiz, $attempt] = $this->makeQuizWithAttempt($this->makeTeacher());

        $this->actingAs($this->makeTeacher());

        $this->delete(route('quizzes.attempts.destroy', [$quiz, $attempt]))
            ->assertNotFound();

        $this->assertDatabaseHas('quiz_attempts', ['id' => $attempt->id]);
    }
}
