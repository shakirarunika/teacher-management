<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\AcademicYear;
use App\Models\Subject;
use App\Models\Classroom;
use App\Models\Student;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Users
        $admin = User::create([
            'name' => 'Administrator',
            'email' => 'admin@admin.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $teacher = User::create([
            'name' => 'Budi Guru',
            'email' => 'teacher@teacher.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
        ]);

        // 2. Academic Year
        $academicYear = AcademicYear::create([
            'name' => '2023/2024',
            'is_active' => true,
        ]);

        // 3. Subjects
        $math = Subject::create(['name' => 'Matematika', 'code' => 'MAT']);
        $eng = Subject::create(['name' => 'Bahasa Inggris', 'code' => 'ENG']);
        $science = Subject::create(['name' => 'IPA', 'code' => 'IPA']);

        // 4. Assessment Types (Removed)

        // 5. Generate 5 Classrooms for the teacher
        $classrooms = [];
        for ($i = 1; $i <= 5; $i++) {
            $classrooms[] = Classroom::create([
                'name' => "Kelas 10" . chr(64 + $i), // 10A, 10B, 10C...
                'teacher_id' => $teacher->id,
            ]);
        }

        // 6. Generate 100 Students and attach them to classrooms, and generate scores/attendances
        $students = Student::factory(100)->create();

        foreach ($students as $student) {
            // Assign to a random classroom
            $classroom = fake()->randomElement($classrooms);
            
            $classroom->students()->attach($student->id, [
                'academic_year_id' => $academicYear->id,
            ]);

            // Generate Attendances for this student in this classroom
            for ($day = 1; $day <= 10; $day++) {
                \App\Models\Attendance::factory()->create([
                    'classroom_id' => $classroom->id,
                    'student_id' => $student->id,
                    'date' => now()->subDays(10 - $day)->format('Y-m-d'),
                ]);
            }

            // Generate Scores
            foreach ([$math, $eng, $science] as $subject) {
                \App\Models\Score::factory()->create([
                    'student_id' => $student->id,
                    'classroom_id' => $classroom->id,
                    'subject_id' => $subject->id,
                    'tugas' => rand(70, 100),
                    'pts' => rand(70, 100),
                    'pas' => rand(70, 100),
                ]);
            }
        }
    }
}
