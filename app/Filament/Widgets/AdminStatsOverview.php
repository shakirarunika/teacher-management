<?php

namespace App\Filament\Widgets;

use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Score;
use App\Models\Student;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Cache;

class AdminStatsOverview extends BaseWidget
{
    protected static ?int $sort = 0;

    protected function getStats(): array
    {
        // Komputasi berat (loop semua nilai lintas-tenant) di-cache 10 menit
        // agar dashboard admin tidak menghitung ulang tiap kali dibuka.
        $d = Cache::remember('admin_stats_overview', now()->addMinutes(10), fn () => $this->computeStats());

        return [
            Stat::make('Total Guru', $d['totalGuru'])
                ->description('Guru terdaftar')
                ->descriptionIcon('heroicon-m-academic-cap')
                ->color('indigo'),

            Stat::make('Total Siswa', $d['totalSiswa'])
                ->description('Siswa aktif di semua kelas')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('emerald'),

            Stat::make('Total Kelas', $d['totalKelas'])
                ->description('Kelas terdaftar')
                ->descriptionIcon('heroicon-m-building-library')
                ->color('purple'),

            Stat::make('Tingkat Kehadiran', $d['attendanceRate'] . '%')
                ->description('Rata-rata kehadiran seluruh kelas')
                ->descriptionIcon('heroicon-m-chart-bar')
                ->color($d['attendanceRate'] >= 80 ? 'success' : ($d['attendanceRate'] >= 60 ? 'warning' : 'danger')),

            Stat::make('Di Bawah KKM', $d['belowKkm'] . ' nilai')
                ->description('Nilai akhir di bawah KKM')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color($d['belowKkm'] > 0 ? 'danger' : 'success'),

            Stat::make('Alpha Terbanyak', $d['worstName'] ?? '-')
                ->description($d['worstName'] ? $d['worstAlpha'] . 'x Alpha tercatat' : 'Belum ada data')
                ->descriptionIcon('heroicon-m-x-circle')
                ->color('warning'),
        ];
    }

    private function computeStats(): array
    {
        $totalAttendance = Attendance::count();
        $totalHadir = Attendance::where('status', 'Hadir')->count();
        $attendanceRate = $totalAttendance > 0 ? round(($totalHadir / $totalAttendance) * 100) : 0;

        // Agregasi absensi per (classroom_id, student_id) dalam satu query
        $attAgg = Attendance::selectRaw('classroom_id, student_id,
                COUNT(*) as total_days,
                SUM(status = \'Hadir\') as total_hadir,
                SUM(status = \'Alpha\') as total_alpha')
            ->groupBy('classroom_id', 'student_id')
            ->get()
            ->keyBy(fn ($r) => $r->classroom_id . '_' . $r->student_id);

        // Setelan penilaian per guru (kelas -> guru -> bobot + KKM)
        $classTeacher = Classroom::pluck('teacher_id', 'id');
        $settingsByTeacher = User::whereIn('id', $classTeacher->unique()->values())->get()->keyBy('id');
        $default = ['kehadiran' => 30, 'tugas' => 20, 'pts' => 10, 'pas' => 40, 'kkm' => 77];

        $belowKkm = 0;
        foreach (Score::all() as $score) {
            $att = $attAgg->get($score->classroom_id . '_' . $score->student_id);
            $totalDays = (int) ($att->total_days ?? 0);
            $totalHadirS = (int) ($att->total_hadir ?? 0);
            $totalAlpha = (int) ($att->total_alpha ?? 0);

            // ->get() aman untuk kelas warisan tanpa teacher_id (akses [null] = fatal di HTTP)
            $w = $settingsByTeacher->get($classTeacher->get($score->classroom_id))?->gradingWeights() ?? $default;

            if ($totalAlpha >= 3) {
                $belowKkm++;
                continue;
            }
            $kehadiran = $totalDays > 0 ? round(($totalHadirS / $totalDays) * 100) : 0;
            $final = ($kehadiran * $w['kehadiran'] + ($score->tugas ?? 0) * $w['tugas'] + ($score->pts ?? 0) * $w['pts'] + ($score->pas ?? 0) * $w['pas']) / 100;
            if (round($final) < $w['kkm']) {
                $belowKkm++;
            }
        }

        $worst = Classroom::withCount([
            'attendances as alpha_count' => fn ($q) => $q->where('status', 'Alpha'),
        ])->orderByDesc('alpha_count')->first();

        return [
            'totalGuru' => User::where('role', 'teacher')->count(),
            'totalSiswa' => Student::count(),
            'totalKelas' => Classroom::count(),
            'attendanceRate' => $attendanceRate,
            'belowKkm' => $belowKkm,
            'worstName' => $worst?->name,
            'worstAlpha' => $worst?->alpha_count,
        ];
    }
}
