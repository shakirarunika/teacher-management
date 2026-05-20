<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Subject;
use App\Models\Score;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScoreController extends Controller
{
    /**
     * Display the score input interface.
     */
    public function index(Request $request, Classroom $classroom)
    {
        // Prevent unauthorized access
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $subjects = Subject::orderBy('name')->get();

        // Get filter inputs or default to the first available
        $subjectId = $request->query('subject_id');

        $students = $classroom->students()->orderBy('name')->get();
        
        $scores = [];
        
        // If filter is selected, fetch existing scores
        if ($subjectId) {
            $scores = Score::where('classroom_id', $classroom->id)
                ->where('subject_id', $subjectId)
                ->get()
                ->keyBy('student_id');
        }

        // Pre-calculate attendance stats for each student
        $attendanceStats = [];
        $attendances = Attendance::where('classroom_id', $classroom->id)->get();
        
        // Group by student
        $groupedAttendances = $attendances->groupBy('student_id');
        
        foreach ($students as $student) {
            $studentAttendances = $groupedAttendances->get($student->id, collect());
            $totalDays = $studentAttendances->count();
            $totalHadir = $studentAttendances->where('status', 'Hadir')->count();
            $totalAlpha = $studentAttendances->where('status', 'Alpha')->count();
            
            $kehadiranScore = 0;
            if ($totalDays > 0) {
                $kehadiranScore = round(($totalHadir / $totalDays) * 100);
            }

            $attendanceStats[$student->id] = [
                'total_days' => $totalDays,
                'total_hadir' => $totalHadir,
                'total_alpha' => $totalAlpha,
                'kehadiran_score' => $kehadiranScore, // Base 100
            ];
        }

        return Inertia::render('Scores/Index', [
            'classroom' => $classroom->only(['id', 'name']),
            'subjects' => $subjects,
            'students' => $students,
            'existingScores' => $scores,
            'attendanceStats' => $attendanceStats,
            'filters' => [
                'subject_id' => (int) $subjectId,
            ]
        ]);
    }

    /**
     * Store or update scores in bulk.
     */
    public function store(Request $request, Classroom $classroom)
    {
        // Prevent unauthorized access
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'scores' => 'required|array',
            'scores.*.student_id' => 'required|exists:students,id',
            'scores.*.tugas' => 'nullable|integer|min:0|max:100',
            'scores.*.pts' => 'nullable|integer|min:0|max:100',
            'scores.*.pas' => 'nullable|integer|min:0|max:100',
        ]);

        foreach ($validated['scores'] as $item) {
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
