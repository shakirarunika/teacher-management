<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\StylesSpreadsheet;
use App\Models\Classroom;
use App\Models\Attendance;
use App\Models\Holiday;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class AttendanceReportController extends Controller
{
    use StylesSpreadsheet;

    public function show(Request $request, Classroom $classroom)
    {
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $month = $request->query('month', Carbon::today()->format('m'));
        $year = $request->query('year', Carbon::today()->format('Y'));

        $data = $this->buildReportData($classroom, $month, $year);

        return Inertia::render('Attendance/Report', [
            'classroom' => $classroom->only(['id', 'name']),
            'filters' => ['month' => $month, 'year' => $year],
            'summary' => $data['summary'],
            'detail' => $data['detail'],
            'recordedDates' => $data['recordedDates'],
            'holidays' => $data['holidays'],
        ]);
    }

    /**
     * Export satu file Excel rapi berisi Rekapitulasi + Detail Harian kelas.
     */
    public function export(Request $request, Classroom $classroom)
    {
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $month = $request->query('month', Carbon::today()->format('m'));
        $year = $request->query('year', Carbon::today()->format('Y'));

        $data = $this->buildReportData($classroom, $month, $year);
        $summary = $data['summary'];
        $detail = $data['detail'];
        $dates = $data['recordedDates'];
        $holidays = $data['holidays'];

        $ss = new Spreadsheet();
        $sheet = $ss->getActiveSheet();
        $sheet->setTitle('Rekap Absensi');

        // ---- Judul ----
        $sheet->setCellValue('A1', 'REKAP ABSENSI SISWA');
        $sheet->setCellValue('A2', "Kelas: {$classroom->name}");
        $sheet->setCellValue('A3', 'Periode: ' . $this->monthName($month) . ' ' . $year);
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A2:A3')->getFont()->setBold(true)->setSize(11);

        // ===== A. REKAPITULASI =====
        $row = 5;
        $sheet->setCellValue("A{$row}", 'A. REKAPITULASI');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(12);
        $row++;

        $headRow = $row;
        foreach (['No', 'NIS', 'Nama Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpha', '% Hadir'] as $i => $label) {
            $sheet->setCellValue(Coordinate::stringFromColumnIndex($i + 1) . $row, $label);
        }
        $this->styleHeader($sheet, "A{$row}:H{$row}");
        $row++;

        $no = 1;
        foreach ($summary as $r) {
            $total = $r['hadir'] + $r['sakit'] + $r['izin'] + $r['alpha'];
            $pct = $total > 0 ? round($r['hadir'] / $total * 100) : 0;
            $sheet->setCellValue("A{$row}", $no++);
            $sheet->setCellValue("B{$row}", $r['nis']);
            $sheet->setCellValue("C{$row}", $r['name']);
            $sheet->setCellValue("D{$row}", $r['hadir']);
            $sheet->setCellValue("E{$row}", $r['sakit']);
            $sheet->setCellValue("F{$row}", $r['izin']);
            $sheet->setCellValue("G{$row}", $r['alpha']);
            $sheet->setCellValue("H{$row}", $pct . '%');
            $row++;
        }
        $rekapEnd = $row - 1;
        $this->styleBorders($sheet, "A{$headRow}:H{$rekapEnd}");
        $sheet->getStyle("A{$headRow}:A{$rekapEnd}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("D{$headRow}:H{$rekapEnd}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // ===== B. DETAIL HARIAN =====
        $row += 2;
        $sheet->setCellValue("A{$row}", 'B. DETAIL HARIAN');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(12);
        $row++;

        $dHead = $row;
        $sheet->setCellValue("A{$row}", 'No');
        $sheet->setCellValue("B{$row}", 'NIS');
        $sheet->setCellValue("C{$row}", 'Nama Siswa');
        $col = 4;
        $dateCol = [];
        foreach ($dates as $d) {
            $sheet->setCellValue(Coordinate::stringFromColumnIndex($col) . $row, (int) substr($d, 8, 2));
            $dateCol[$d] = $col;
            $col++;
        }
        $lastCol = Coordinate::stringFromColumnIndex(max($col - 1, 3));
        $this->styleHeader($sheet, "A{$row}:{$lastCol}{$row}");
        // tandai kolom hari libur (abu-abu) setelah header utama
        foreach ($holidays as $d => $info) {
            if (isset($dateCol[$d])) {
                $cell = Coordinate::stringFromColumnIndex($dateCol[$d]) . $row;
                $sheet->getStyle($cell)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('6B7280');
            }
        }
        $row++;

        $letterMap = ['Hadir' => 'H', 'Sakit' => 'S', 'Izin' => 'I', 'Alpha' => 'A'];
        $colorMap = ['H' => 'C6EFCE', 'S' => 'FFEB9C', 'I' => 'BDD7EE', 'A' => 'FFC7CE', 'L' => 'E5E7EB'];

        $no = 1;
        foreach ($detail as $s) {
            $sheet->setCellValue("A{$row}", $no++);
            $sheet->setCellValue("B{$row}", $s['nis']);
            $sheet->setCellValue("C{$row}", $s['name']);
            foreach ($dates as $d) {
                $status = $s['logs']->get($d);
                if ($status) {
                    $letter = $letterMap[$status] ?? '?';
                } elseif (isset($holidays[$d])) {
                    $letter = 'L';
                } else {
                    $letter = '-';
                }
                $cell = Coordinate::stringFromColumnIndex($dateCol[$d]) . $row;
                $sheet->setCellValue($cell, $letter);
                $sheet->getStyle($cell)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                if (isset($colorMap[$letter])) {
                    $sheet->getStyle($cell)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB($colorMap[$letter]);
                }
            }
            $row++;
        }
        $detailEnd = $row - 1;
        $this->styleBorders($sheet, "A{$dHead}:{$lastCol}{$detailEnd}");
        $sheet->getStyle("A{$dHead}:A{$detailEnd}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Keterangan
        $row += 1;
        $sheet->setCellValue("A{$row}", 'Keterangan: H = Hadir, S = Sakit, I = Izin, A = Alpha, L = Libur, - = Belum tercatat');
        $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->setSize(9);

        // Lebar kolom
        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(14);
        $sheet->getColumnDimension('C')->setWidth(30);
        for ($c = 4; $c < $col; $c++) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($c))->setWidth(5);
        }

        $filename = 'Absensi_' . str_replace(' ', '_', $classroom->name) . "_{$year}-{$month}.xlsx";
        $writer = new Xlsx($ss);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function buildReportData(Classroom $classroom, $month, $year): array
    {
        $students = $classroom->students()->orderBy('name')->get();

        $attendances = Attendance::where('classroom_id', $classroom->id)
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get();

        $holidays = Holiday::whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get()
            ->mapWithKeys(function ($h) {
                $dateStr = is_string($h->date) ? $h->date : $h->date->format('Y-m-d');
                return [$dateStr => ['name' => $h->name, 'type' => $h->type]];
            });

        $summary = $students->map(fn ($student) => [
            'id' => $student->id,
            'name' => $student->name,
            'nis' => $student->nis,
            'hadir' => $attendances->where('student_id', $student->id)->where('status', 'Hadir')->count(),
            'sakit' => $attendances->where('student_id', $student->id)->where('status', 'Sakit')->count(),
            'izin' => $attendances->where('student_id', $student->id)->where('status', 'Izin')->count(),
            'alpha' => $attendances->where('student_id', $student->id)->where('status', 'Alpha')->count(),
        ]);

        $detail = $students->map(fn ($student) => [
            'name' => $student->name,
            'nis' => $student->nis,
            'logs' => $attendances->where('student_id', $student->id)->mapWithKeys(fn ($att) => [$att->date => $att->status]),
        ]);

        $recordedDates = $attendances->pluck('date')
            ->merge($holidays->keys())
            ->unique()
            ->sort()
            ->values();

        return compact('summary', 'detail', 'recordedDates', 'holidays');
    }

    private function monthName($month): string
    {
        $names = [1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        return $names[(int) $month] ?? (string) $month;
    }
}
