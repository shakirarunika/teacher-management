<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Attendance;
use App\Models\Holiday;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceReportController extends Controller
{
    /**
     * Display the monthly attendance report for a specific classroom.
     */
    public function show(Request $request, Classroom $classroom)
    {
        // Pastikan hanya guru yang bersangkutan yang bisa akses
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $month = $request->query('month', Carbon::today()->format('m'));
        $year = $request->query('year', Carbon::today()->format('Y'));

        // Ambil semua murid di kelas ini
        $students = $classroom->students()->orderBy('name')->get();

        // Ambil semua data absensi bulan ini untuk kelas ini
        $attendances = Attendance::where('classroom_id', $classroom->id)
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get();

        // Ambil semua hari libur bulan ini
        $holidaysData = Holiday::whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get();

        // Key by date string
        $holidays = $holidaysData->mapWithKeys(function($h) {
            $dateStr = is_string($h->date) ? $h->date : $h->date->format('Y-m-d');
            return [$dateStr => [
                'name' => $h->name,
                'type' => $h->type,
            ]];
        });

        // Rekap Summary per Murid
        $summary = $students->map(function ($student) use ($attendances) {
            $studentAttendances = $attendances->where('student_id', $student->id);
            
            return [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'hadir' => $studentAttendances->where('status', 'Hadir')->count(),
                'sakit' => $studentAttendances->where('status', 'Sakit')->count(),
                'izin' => $studentAttendances->where('status', 'Izin')->count(),
                'alpha' => $studentAttendances->where('status', 'Alpha')->count(),
            ];
        });

        // Detail per Murid (Untuk Export & Display)
        $detail = $students->map(function ($student) use ($attendances) {
            $studentAttendances = $attendances->where('student_id', $student->id)->mapWithKeys(function($att) {
                return [$att->date => $att->status];
            });

            return [
                'name' => $student->name,
                'nis' => $student->nis,
                'logs' => $studentAttendances
            ];
        });

        // Unique dates (attendance dates + holidays in that month)
        $holidayDates = $holidays->keys();
        $recordedDates = $attendances->pluck('date')
            ->merge($holidayDates)
            ->unique()
            ->sort()
            ->values();

        return Inertia::render('Attendance/Report', [
            'classroom' => $classroom->only(['id', 'name']),
            'filters' => [
                'month' => $month,
                'year' => $year,
            ],
            'summary' => $summary,
            'detail' => $detail,
            'recordedDates' => $recordedDates,
            'holidays' => $holidays,
        ]);
    }
}
