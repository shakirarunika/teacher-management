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

        // Eager load murid yang ada di kelas ini beserta status absensinya pada tanggal tersebut
        $students = $classroom->students()->orderBy('name')->get()->map(function ($student) use ($classroom, $date) {
            $attendance = Attendance::where('classroom_id', $classroom->id)
                ->where('student_id', $student->id)
                ->where('date', $date)
                ->first();

            return [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'status' => $attendance ? $attendance->status : null,
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

        foreach ($validated['attendances'] as $attendanceData) {
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
