<?php

namespace App\Support;

use App\Models\Attendance;

/**
 * Logika penilaian dipakai bersama oleh layar input nilai & export laporan.
 */
class Grading
{
    /** Statistik kehadiran kumulatif per siswa (seluruh tanggal). */
    public static function attendanceStats($classroom, $students): array
    {
        $grouped = Attendance::where('classroom_id', $classroom->id)->get()->groupBy('student_id');

        $stats = [];
        foreach ($students as $student) {
            $att = $grouped->get($student->id, collect());
            $totalDays = $att->count();
            $totalHadir = $att->where('status', 'Hadir')->count();

            $stats[$student->id] = [
                'total_days' => $totalDays,
                'total_hadir' => $totalHadir,
                'total_alpha' => $att->where('status', 'Alpha')->count(),
                'kehadiran_score' => $totalDays > 0 ? (int) round($totalHadir / $totalDays * 100) : 0,
            ];
        }

        return $stats;
    }

    /**
     * Hitung nilai akhir + predikat. Alpha >= 3 kali = penalti (76).
     *
     * PENTING: formula ini HARUS sama dengan calculateFinalScore di
     * resources/js/Pages/Scores/Index.jsx (kalkulasi live di layar input).
     * Jika rumus/penalti/bobot berubah, ubah di KEDUA tempat.
     *
     * @return array{final:int, predikat:string, penalty:bool}
     */
    public static function finalScore(array $stat, $tugas, $pts, $pas, array $w): array
    {
        if ($stat['total_alpha'] >= 3) {
            return ['final' => 76, 'predikat' => 'Penalti', 'penalty' => true];
        }

        $final = (int) round(
            ($stat['kehadiran_score'] * $w['kehadiran']
                + ($tugas ?? 0) * $w['tugas']
                + ($pts ?? 0) * $w['pts']
                + ($pas ?? 0) * $w['pas']) / 100
        );

        return ['final' => $final, 'predikat' => self::predikat($final), 'penalty' => false];
    }

    public static function predikat(int $final): string
    {
        return match (true) {
            $final >= 90 => 'A',
            $final >= 80 => 'B',
            $final >= 70 => 'C',
            $final >= 60 => 'D',
            default => 'E',
        };
    }
}
