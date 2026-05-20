<?php

namespace App\Filament\Widgets;

use Filament\Widgets\StatsOverviewWidget as BaseStatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverviewWidget extends BaseStatsOverviewWidget
{
    protected function getStats(): array
    {
        $today = now()->format('Y-m-d');
        $attendanceToday = \App\Models\Attendance::where('date', $today)->count();

        return [
            Stat::make('Total Students', \App\Models\Student::count())
                ->description('Total siswa terdaftar')
                ->icon('heroicon-o-users'),
            Stat::make('Total Classrooms', \App\Models\Classroom::count())
                ->description('Total kelas aktif')
                ->icon('heroicon-o-academic-cap'),
            Stat::make('Today\'s Attendance', $attendanceToday)
                ->description('Total absensi hari ini')
                ->icon('heroicon-o-clipboard-document-check'),
        ];
    }
}
