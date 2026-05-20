<?php

namespace App\Filament\Widgets;

use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Score;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\DB;

class AdminStatsOverview extends BaseWidget
{
    protected static ?int $sort = 0;

    protected function getStats(): array
    {
        // Attendance rate overall
        $totalAttendance = Attendance::count();
        $totalHadir = Attendance::where('status', 'Hadir')->count();
        $attendanceRate = $totalAttendance > 0 ? round(($totalHadir / $totalAttendance) * 100) : 0;

        // Students below KKM (final score < 77)
        // We calculate per score record
        $belowKkmCount = 0;
        $scoreRecords = Score::with('student')->get();
        $processedStudents = [];
        foreach ($scoreRecords as $score) {
            $key = $score->student_id . '_' . $score->subject_id;
            if (in_array($key, $processedStudents)) continue;
            $processedStudents[] = $key;

            $totalDays = Attendance::where('classroom_id', $score->classroom_id)
                ->where('student_id', $score->student_id)->count();
            $totalHadirS = Attendance::where('classroom_id', $score->classroom_id)
                ->where('student_id', $score->student_id)->where('status', 'Hadir')->count();
            $totalAlpha = Attendance::where('classroom_id', $score->classroom_id)
                ->where('student_id', $score->student_id)->where('status', 'Alpha')->count();

            if ($totalAlpha >= 3) {
                $belowKkmCount++;
                continue;
            }
            $kehadiran = $totalDays > 0 ? round(($totalHadirS / $totalDays) * 100) : 0;
            $final = ($kehadiran * 0.3) + (($score->tugas ?? 0) * 0.2) + (($score->pts ?? 0) * 0.1) + (($score->pas ?? 0) * 0.4);
            if (round($final) < 77) $belowKkmCount++;
        }

        // Class with lowest attendance
        $worstClass = Classroom::withCount([
            'attendances as alpha_count' => fn($q) => $q->where('status', 'Alpha')
        ])->orderByDesc('alpha_count')->first();

        return [
            Stat::make('Total Guru', User::where('role', 'teacher')->count())
                ->description('Guru terdaftar')
                ->descriptionIcon('heroicon-m-academic-cap')
                ->color('indigo'),

            Stat::make('Total Siswa', Student::count())
                ->description('Siswa aktif di semua kelas')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('emerald'),

            Stat::make('Total Kelas', Classroom::count())
                ->description('Kelas terdaftar')
                ->descriptionIcon('heroicon-m-building-library')
                ->color('purple'),

            Stat::make('Tingkat Kehadiran', $attendanceRate . '%')
                ->description('Rata-rata kehadiran seluruh kelas')
                ->descriptionIcon('heroicon-m-chart-bar')
                ->color($attendanceRate >= 80 ? 'success' : ($attendanceRate >= 60 ? 'warning' : 'danger')),

            Stat::make('Di Bawah KKM', $belowKkmCount . ' nilai')
                ->description('Nilai akhir < 77 (KKM)')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color($belowKkmCount > 0 ? 'danger' : 'success'),

            Stat::make('Alpha Terbanyak', $worstClass ? $worstClass->name : '-')
                ->description($worstClass ? $worstClass->alpha_count . 'x Alpha tercatat' : 'Belum ada data')
                ->descriptionIcon('heroicon-m-x-circle')
                ->color('warning'),
        ];
    }
}
