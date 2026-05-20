<?php

namespace Database\Factories;

use App\Models\Score;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Score>
 */
class ScoreFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => \App\Models\Student::factory(),
            'classroom_id' => \App\Models\Classroom::factory(),
            'subject_id' => \App\Models\Subject::first() ?? 1,
            'tugas' => fake()->numberBetween(50, 100),
            'pts' => fake()->numberBetween(50, 100),
            'pas' => fake()->numberBetween(50, 100),
        ];
    }
}
