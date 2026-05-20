<?php

namespace Database\Factories;

use App\Models\Attendance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Attendance>
 */
class AttendanceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'classroom_id' => \App\Models\Classroom::factory(),
            'student_id' => \App\Models\Student::factory(),
            'date' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'status' => fake()->randomElement(['Hadir', 'Hadir', 'Hadir', 'Hadir', 'Sakit', 'Izin', 'Alpha']),
        ];
    }
}
