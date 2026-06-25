<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\StylesSpreadsheet;
use App\Models\Classroom;
use App\Models\Attendance;
use App\Models\Holiday;
use App\Models\Score;
use App\Models\Subject;
use App\Support\Grading;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
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
     * Export satu file Excel lengkap per kelas:
     * Rekap Absensi + Absensi Harian + Detail Nilai per mata pelajaran.
     */
    public function export(Request $request, Classroom $classroom)
    {
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $month = $request->query('month', Carbon::today()->format('m'));
        $year = $request->query('year', Carbon::today()->format('Y'));

        $data = $this->buildReportData($classroom, $month, $year);
        $periode = $this->monthName($month) . ' ' . $year;

        $ss = new Spreadsheet();

        // Sheet 1: Rekap Absensi
        $rekap = $ss->getActiveSheet();
        $rekap->setTitle('Rekap Absensi');
        $this->writeRekapSheet($rekap, $classroom, $periode, $data['summary']);

        // Sheet 2: Absensi Harian
        $harian = $ss->createSheet();
        $harian->setTitle('Absensi Harian');
        $this->writeDetailSheet($harian, $classroom, $periode, $data['detail'], $data['recordedDates'], $data['holidays']);

        // Sheet 3..: Nilai per mata pelajaran (hanya mapel yang punya nilai di kelas ini)
        $students = $classroom->students()->orderBy('name')->get();
        $stats = Grading::attendanceStats($classroom, $students);
        $weights = $request->user()->gradingWeights();

        $subjectIds = Score::where('classroom_id', $classroom->id)->distinct()->pluck('subject_id');
        $subjects = Subject::whereIn('id', $subjectIds)->orderBy('name')->get();

        foreach ($subjects as $subject) {
            $scores = Score::where('classroom_id', $classroom->id)
                ->where('subject_id', $subject->id)
                ->get()->keyBy('student_id');

            $sheet = $ss->createSheet();
            $sheet->setTitle($this->sheetTitle('Nilai ' . $subject->name));
            $this->writeNilaiSheet($sheet, $classroom, $subject, $students, $scores, $stats, $weights);
        }

        $ss->setActiveSheetIndex(0);

        $filename = 'Laporan_' . str_replace(' ', '_', $classroom->name) . "_{$year}-{$month}.xlsx";
        $writer = new Xlsx($ss);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function writeRekapSheet(Worksheet $sheet, Classroom $classroom, string $periode, $summary): void
    {
        $sheet->setCellValue('A1', 'REKAP ABSENSI SISWA');
        $sheet->setCellValue('A2', "Kelas: {$classroom->name}");
        $sheet->setCellValue('A3', "Periode: {$periode}");
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A2:A3')->getFont()->setBold(true)->setSize(11);

        $head = 5;
        foreach (['No', 'NIS', 'Nama Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpha', '% Hadir'] as $i => $label) {
            $sheet->setCellValue(Coordinate::stringFromColumnIndex($i + 1) . $head, $label);
        }
        $this->styleHeader($sheet, "A{$head}:H{$head}");

        $row = $head + 1;
        $no = 1;
        foreach ($summary as $r) {
            $total = $r['hadir'] + $r['sakit'] + $r['izin'] + $r['alpha'];
            $pct = $total > 0 ? round($r['hadir'] / $total * 100) : 0;
            $sheet->fromArray([$no++, $r['nis'], $r['name'], $r['hadir'], $r['sakit'], $r['izin'], $r['alpha'], $pct . '%'], null, "A{$row}");
            $row++;
        }
        $end = $row - 1;
        $this->styleBorders($sheet, "A{$head}:H{$end}");
        $sheet->getStyle("A{$head}:A{$end}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("D{$head}:H{$end}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(14);
        $sheet->getColumnDimension('C')->setWidth(30);
        foreach (['D', 'E', 'F', 'G', 'H'] as $c) {
            $sheet->getColumnDimension($c)->setWidth(9);
        }
    }

    private function writeDetailSheet(Worksheet $sheet, Classroom $classroom, string $periode, $detail, $dates, $holidays): void
    {
        $sheet->setCellValue('A1', 'DETAIL ABSENSI HARIAN');
        $sheet->setCellValue('A2', "Kelas: {$classroom->name}  |  Periode: {$periode}");
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(11);

        $head = 4;
        $sheet->setCellValue("A{$head}", 'No');
        $sheet->setCellValue("B{$head}", 'NIS');
        $sheet->setCellValue("C{$head}", 'Nama Siswa');
        $col = 4;
        $dateCol = [];
        foreach ($dates as $d) {
            $sheet->setCellValue(Coordinate::stringFromColumnIndex($col) . $head, (int) substr($d, 8, 2));
            $dateCol[$d] = $col++;
        }
        $lastCol = Coordinate::stringFromColumnIndex(max($col - 1, 3));
        $this->styleHeader($sheet, "A{$head}:{$lastCol}{$head}");
        foreach ($holidays as $d => $info) {
            if (isset($dateCol[$d])) {
                $cell = Coordinate::stringFromColumnIndex($dateCol[$d]) . $head;
                $sheet->getStyle($cell)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('6B7280');
            }
        }

        $letterMap = ['Hadir' => 'H', 'Sakit' => 'S', 'Izin' => 'I', 'Alpha' => 'A'];
        $colorMap = ['H' => 'C6EFCE', 'S' => 'FFEB9C', 'I' => 'BDD7EE', 'A' => 'FFC7CE', 'L' => 'E5E7EB'];

        $row = $head + 1;
        $no = 1;
        foreach ($detail as $s) {
            $sheet->setCellValue("A{$row}", $no++);
            $sheet->setCellValue("B{$row}", $s['nis']);
            $sheet->setCellValue("C{$row}", $s['name']);
            foreach ($dates as $d) {
                $status = $s['logs']->get($d);
                $letter = $status ? ($letterMap[$status] ?? '?') : (isset($holidays[$d]) ? 'L' : '-');
                $cell = Coordinate::stringFromColumnIndex($dateCol[$d]) . $row;
                $sheet->setCellValue($cell, $letter);
                $sheet->getStyle($cell)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                if (isset($colorMap[$letter])) {
                    $sheet->getStyle($cell)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB($colorMap[$letter]);
                }
            }
            $row++;
        }
        $end = $row - 1;
        $this->styleBorders($sheet, "A{$head}:{$lastCol}{$end}");
        $sheet->getStyle("A{$head}:A{$end}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $row += 1;
        $sheet->setCellValue("A{$row}", 'Keterangan: H = Hadir, S = Sakit, I = Izin, A = Alpha, L = Libur, - = Belum tercatat');
        $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->setSize(9);

        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(14);
        $sheet->getColumnDimension('C')->setWidth(30);
        for ($c = 4; $c < $col; $c++) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($c))->setWidth(5);
        }
    }

    private function writeNilaiSheet(Worksheet $sheet, Classroom $classroom, Subject $subject, $students, $scores, array $stats, array $w): void
    {
        $sheet->setCellValue('A1', 'DAFTAR NILAI');
        $sheet->setCellValue('A2', "Kelas: {$classroom->name}  |  Mapel: {$subject->name}");
        $sheet->setCellValue('A3', "Bobot: Kehadiran {$w['kehadiran']}% · Tugas {$w['tugas']}% · PTS {$w['pts']}% · PAS {$w['pas']}%");
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('A3')->getFont()->setItalic(true)->setSize(9);

        $head = 5;
        $headers = ['No', 'NIS', 'Nama Siswa', "Kehadiran ({$w['kehadiran']}%)", "Tugas ({$w['tugas']}%)", "PTS ({$w['pts']}%)", "PAS ({$w['pas']}%)", 'Nilai Akhir', 'Predikat'];
        foreach ($headers as $i => $label) {
            $sheet->setCellValue(Coordinate::stringFromColumnIndex($i + 1) . $head, $label);
        }
        $this->styleHeader($sheet, "A{$head}:I{$head}");

        $row = $head + 1;
        $no = 1;
        foreach ($students as $student) {
            $score = $scores->get($student->id);
            $tugas = $score?->tugas;
            $pts = $score?->pts;
            $pas = $score?->pas;
            $calc = Grading::finalScore($stats[$student->id], $tugas, $pts, $pas, $w);

            $sheet->fromArray([
                $no++, $student->nis, $student->name,
                $stats[$student->id]['kehadiran_score'],
                $tugas ?? '-', $pts ?? '-', $pas ?? '-',
                $calc['final'], $calc['predikat'],
            ], null, "A{$row}");
            $row++;
        }
        $end = $row - 1;
        $this->styleBorders($sheet, "A{$head}:I{$end}");
        $sheet->getStyle("A{$head}:A{$end}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("D{$head}:I{$end}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('H' . ($head + 1) . ":H{$end}")->getFont()->setBold(true);

        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(14);
        $sheet->getColumnDimension('C')->setWidth(30);
        foreach (['D', 'E', 'F', 'G', 'H', 'I'] as $c) {
            $sheet->getColumnDimension($c)->setWidth(13);
        }
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

    /** Judul worksheet valid: tanpa karakter terlarang, maks 31 karakter. */
    private function sheetTitle(string $title): string
    {
        $clean = str_replace(['\\', '/', '?', '*', '[', ']', ':'], ' ', $title);

        return mb_substr(trim($clean), 0, 31);
    }

    private function monthName($month): string
    {
        $names = [1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        return $names[(int) $month] ?? (string) $month;
    }
}
