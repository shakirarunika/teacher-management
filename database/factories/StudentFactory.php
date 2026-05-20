<?php

namespace Database\Factories;

use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nis' => fake()->unique()->numerify('#####'),
            'name' => fake()->name(),
            'gender' => fake()->randomElement(['L', 'P']),
            'date_of_birth' => fake()->dateTimeBetween('-18 years', '-15 years')->format('Y-m-d'),
            'address' => fake()->address(),
        ];
    }
}
