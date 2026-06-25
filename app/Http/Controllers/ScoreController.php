<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Subject;
use App\Models\Score;
use App\Support\Grading;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ScoreController extends Controller
{
    /**
     * Display the score input interface.
     */
    public function index(Request $request, Classroom $classroom)
    {
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $subjects = Subject::orderBy('name')->get();
        $subjectId = $request->query('subject_id');
        $students = $classroom->students()->orderBy('name')->get();

        $scores = [];
        if ($subjectId) {
            $scores = Score::where('classroom_id', $classroom->id)
                ->where('subject_id', $subjectId)
                ->get()
                ->keyBy('student_id');
        }

        return Inertia::render('Scores/Index', [
            'classroom' => $classroom->only(['id', 'name']),
            'subjects' => $subjects,
            'students' => $students,
            'existingScores' => $scores,
            'attendanceStats' => Grading::attendanceStats($classroom, $students),
            'weights' => $request->user()->gradingWeights(),
            'filters' => [
                'subject_id' => (int) $subjectId,
            ],
        ]);
    }

    /**
     * Store or update scores in bulk.
     */
    public function store(Request $request, Classroom $classroom)
    {
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'subject_id' => ['required', Rule::exists('subjects', 'id')->where('user_id', $request->user()->id)],
            'scores' => 'required|array',
            'scores.*.student_id' => 'required|exists:students,id',
            'scores.*.tugas' => 'nullable|integer|min:0|max:100',
            'scores.*.pts' => 'nullable|integer|min:0|max:100',
            'scores.*.pas' => 'nullable|integer|min:0|max:100',
        ]);

        $classroomStudentIds = $classroom->students()->pluck('students.id')->toArray();

        foreach ($validated['scores'] as $item) {
            if (!in_array($item['student_id'], $classroomStudentIds)) {
                abort(403, 'Unauthorized student score update.');
            }

            Score::updateOrCreate(
                [
                    'classroom_id' => $classroom->id,
                    'student_id' => $item['student_id'],
                    'subject_id' => $validated['subject_id'],
                ],
                [
                    'tugas' => $item['tugas'],
                    'pts' => $item['pts'],
                    'pas' => $item['pas'],
                ]
            );
        }

        return redirect()->route('dashboard')->with('success', 'Scores saved successfully!');
    }
}
