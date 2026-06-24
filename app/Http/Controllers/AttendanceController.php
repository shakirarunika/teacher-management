<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Attendance;
use App\Models\Holiday;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Display the attendance form for a specific classroom and date.
     */
    public function index(Request $request, Classroom $classroom)
    {
        // Pastikan hanya guru yang bersangkutan yang bisa akses
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $date = $request->query('date', Carbon::today()->format('Y-m-d'));

        // Ambil semua absensi kelas ini pada tanggal tsb dalam satu query, lalu key by student_id
        $attendances = Attendance::where('classroom_id', $classroom->id)
            ->where('date', $date)
            ->get()
            ->keyBy('student_id');

        $students = $classroom->students()->orderBy('name')->get()->map(function ($student) use ($attendances) {
            return [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'status' => $attendances->get($student->id)?->status,
            ];
        });

        $holiday = Holiday::where('date', $date)->first();

        return Inertia::render('Attendance/Index', [
            'classroom' => $classroom->only(['id', 'name']),
            'date' => $date,
            'students' => $students,
            'holiday' => $holiday ? $holiday->only(['name', 'type']) : null,
        ]);
    }

    /**
     * Store or update attendances in bulk.
     */
    public function store(Request $request, Classroom $classroom)
    {
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:students,id',
            'attendances.*.status' => 'required|in:Hadir,Sakit,Izin,Alpha',
        ]);

        $classroomStudentIds = $classroom->students()->pluck('students.id')->toArray();

        foreach ($validated['attendances'] as $attendanceData) {
            if (!in_array($attendanceData['student_id'], $classroomStudentIds)) {
                abort(403, 'Unauthorized student attendance update.');
            }

            Attendance::updateOrCreate(
                [
                    'classroom_id' => $classroom->id,
                    'student_id' => $attendanceData['student_id'],
                    'date' => $validated['date'],
                ],
                [
                    'status' => $attendanceData['status'],
                ]
            );
        }

        return redirect()->route('dashboard')->with('success', 'Attendance saved successfully!');
    }
}
