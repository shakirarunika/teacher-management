<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Classroom;
use App\Models\Attendance;
use App\Models\AcademicYear;

class DashboardController extends Controller
{
    public function index()
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        $user = Auth::user();

        // Get classrooms taught by the teacher
        $classrooms = Classroom::where('teacher_id', $user->id)
            ->withCount('students')
            ->orderBy('name', 'asc')
            ->get();

        $totalStudents = $classrooms->sum('students_count');
        $totalClassrooms = $classrooms->count();

        // Get attendance stats for today
        $today = now()->format('Y-m-d');
        
        $todayAttendances = Attendance::whereIn('classroom_id', $classrooms->pluck('id'))
            ->where('date', $today)
            ->get();
        
        // Calculate Overall Attendance Rate (Semester)
        $totalRecorded = Attendance::whereIn('classroom_id', $classrooms->pluck('id'))->count();
        $totalPresent = Attendance::whereIn('classroom_id', $classrooms->pluck('id'))
            ->where('status', 'Hadir')
            ->count();
        
        $attendanceRate = $totalRecorded > 0 ? round(($totalPresent / $totalRecorded) * 100) : 0;

        // Map classrooms to include today's attendance stats
        $classroomsData = $classrooms->map(function($classroom) use ($todayAttendances) {
            $classTodayAttendances = $todayAttendances->where('classroom_id', $classroom->id);
            $isRecorded = $classTodayAttendances->count() > 0;
            $presentCount = $classTodayAttendances->where('status', 'Hadir')->count();
            
            return [
                'id' => $classroom->id,
                'name' => $classroom->name,
                'students_count' => $classroom->students_count,
                'attendance_today' => [
                    'recorded' => $isRecorded,
                    'present' => $presentCount
                ]
            ];
        });

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalStudents' => $totalStudents,
                'totalClassrooms' => $totalClassrooms,
                'attendanceRate' => $attendanceRate,
            ],
            'classrooms' => $classroomsData,
            'academicYear' => $activeYear?->name ?? 'N/A',
            'subjects' => \App\Models\Subject::orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }
}
