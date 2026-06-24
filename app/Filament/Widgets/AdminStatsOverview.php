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
        // Agregasi absensi per (classroom_id, student_id) dalam satu query, lalu hitung di memory
        $attAgg = Attendance::selectRaw('classroom_id, student_id,
                COUNT(*) as total_days,
                SUM(status = \'Hadir\') as total_hadir,
                SUM(status = \'Alpha\') as total_alpha')
            ->groupBy('classroom_id', 'student_id')
            ->get()
            ->keyBy(fn ($r) => $r->classroom_id . '_' . $r->student_id);

        // Bobot penilaian per guru (kelas -> guru -> bobot)
        $classTeacher = Classroom::pluck('teacher_id', 'id');
        $weightsByTeacher = User::whereIn('id', $classTeacher->unique()->values())->get()->keyBy('id');
        $defaultWeights = ['kehadiran' => 30, 'tugas' => 20, 'pts' => 10, 'pas' => 40];

        $belowKkmCount = 0;
        $scoreRecords = Score::all();
        foreach ($scoreRecords as $score) {
            $att = $attAgg->get($score->classroom_id . '_' . $score->student_id);
            $totalDays = (int) ($att->total_days ?? 0);
            $totalHadirS = (int) ($att->total_hadir ?? 0);
            $totalAlpha = (int) ($att->total_alpha ?? 0);

            if ($totalAlpha >= 3) {
                $belowKkmCount++;
                continue;
            }
            $kehadiran = $totalDays > 0 ? round(($totalHadirS / $totalDays) * 100) : 0;
            $teacherId = $classTeacher[$score->classroom_id] ?? null;
            $w = $weightsByTeacher[$teacherId]?->gradingWeights() ?? $defaultWeights;
            $final = ($kehadiran * $w['kehadiran'] + ($score->tugas ?? 0) * $w['tugas'] + ($score->pts ?? 0) * $w['pts'] + ($score->pas ?? 0) * $w['pas']) / 100;
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
