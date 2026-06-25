<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\StylesSpreadsheet;
use App\Models\Classroom;
use App\Models\Subject;
use App\Models\Score;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class ScoreController extends Controller
{
    use StylesSpreadsheet;

    /**
     * Display the score input interface.
     */
    public function index(Request $request, Classroom $classroom)
    {
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $subjects = Subject::orderBy('name')->get();
        $subjectId = $request->query('subject_id');
        $students = $classroom->students()->orderBy('name')->get();

        $scores = [];
        if ($subjectId) {
            $scores = Score::where('classroom_id', $classroom->id)
                ->where('subject_id', $subjectId)
                ->get()
                ->keyBy('student_id');
        }

        return Inertia::render('Scores/Index', [
            'classroom' => $classroom->only(['id', 'name']),
            'subjects' => $subjects,
            'students' => $students,
            'existingScores' => $scores,
            'attendanceStats' => $this->buildAttendanceStats($classroom, $students),
            'weights' => $request->user()->gradingWeights(),
            'filters' => [
                'subject_id' => (int) $subjectId,
            ],
        ]);
    }

    /**
     * Export daftar nilai satu mata pelajaran ke Excel rapi.
     */
    public function export(Request $request, Classroom $classroom)
    {
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $subject = Subject::findOrFail($request->query('subject_id'));
        $students = $classroom->students()->orderBy('name')->get();
        $scores = Score::where('classroom_id', $classroom->id)
            ->where('subject_id', $subject->id)
            ->get()
            ->keyBy('student_id');
        $stats = $this->buildAttendanceStats($classroom, $students);
        $w = $request->user()->gradingWeights();

        $ss = new Spreadsheet();
        $sheet = $ss->getActiveSheet();
        $sheet->setTitle('Daftar Nilai');

        $sheet->setCellValue('A1', 'DAFTAR NILAI');
        $sheet->setCellValue('A2', "Kelas: {$classroom->name}");
        $sheet->setCellValue('A3', "Mata Pelajaran: {$subject->name}");
        $sheet->setCellValue('A4', "Bobot: Kehadiran {$w['kehadiran']}% · Tugas {$w['tugas']}% · PTS {$w['pts']}% · PAS {$w['pas']}%");
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A2:A3')->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('A4')->getFont()->setItalic(true)->setSize(9);

        $headRow = 6;
        $headers = [
            'No', 'NIS', 'Nama Siswa',
            "Kehadiran ({$w['kehadiran']}%)", "Tugas ({$w['tugas']}%)",
            "PTS ({$w['pts']}%)", "PAS ({$w['pas']}%)", 'Nilai Akhir', 'Predikat',
        ];
        foreach ($headers as $i => $label) {
            $sheet->setCellValue(Coordinate::stringFromColumnIndex($i + 1) . $headRow, $label);
        }
        $this->styleHeader($sheet, "A{$headRow}:I{$headRow}");

        $row = $headRow + 1;
        $no = 1;
        foreach ($students as $student) {
            $stat = $stats[$student->id];
            $score = $scores->get($student->id);
            $tugas = $score?->tugas;
            $pts = $score?->pts;
            $pas = $score?->pas;

            $penalty = $stat['total_alpha'] >= 3;
            if ($penalty) {
                $final = 76;
                $predikat = 'Penalti';
            } else {
                $final = (int) round(
                    ($stat['kehadiran_score'] * $w['kehadiran']
                        + ($tugas ?? 0) * $w['tugas']
                        + ($pts ?? 0) * $w['pts']
                        + ($pas ?? 0) * $w['pas']) / 100
                );
                $predikat = $this->predikat($final);
            }

            $sheet->setCellValue("A{$row}", $no++);
            $sheet->setCellValue("B{$row}", $student->nis);
            $sheet->setCellValue("C{$row}", $student->name);
            $sheet->setCellValue("D{$row}", $stat['kehadiran_score']);
            $sheet->setCellValue("E{$row}", $tugas ?? '-');
            $sheet->setCellValue("F{$row}", $pts ?? '-');
            $sheet->setCellValue("G{$row}", $pas ?? '-');
            $sheet->setCellValue("H{$row}", $final);
            $sheet->setCellValue("I{$row}", $predikat);
            $row++;
        }
        $end = $row - 1;

        $this->styleBorders($sheet, "A{$headRow}:I{$end}");
        $sheet->getStyle("A{$headRow}:A{$end}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("D{$headRow}:I{$end}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        // Tebalkan kolom Nilai Akhir
        $sheet->getStyle("H" . ($headRow + 1) . ":H{$end}")->getFont()->setBold(true);

        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(14);
        $sheet->getColumnDimension('C')->setWidth(30);
        foreach (['D', 'E', 'F', 'G', 'H', 'I'] as $c) {
            $sheet->getColumnDimension($c)->setWidth(13);
        }

        $filename = 'Nilai_' . str_replace(' ', '_', $classroom->name) . '_' . str_replace(' ', '_', $subject->name) . '.xlsx';
        $writer = new Xlsx($ss);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Store or update scores in bulk.
     */
    public function store(Request $request, Classroom $classroom)
    {
        if ($classroom->teacher_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'scores' => 'required|array',
            'scores.*.student_id' => 'required|exists:students,id',
            'scores.*.tugas' => 'nullable|integer|min:0|max:100',
            'scores.*.pts' => 'nullable|integer|min:0|max:100',
            'scores.*.pas' => 'nullable|integer|min:0|max:100',
        ]);

        $classroomStudentIds = $classroom->students()->pluck('students.id')->toArray();

        foreach ($validated['scores'] as $item) {
            if (!in_array($item['student_id'], $classroomStudentIds)) {
                abort(403, 'Unauthorized student score update.');
            }

            Score::updateOrCreate(
                [
                    'classroom_id' => $classroom->id,
                    'student_id' => $item['student_id'],
                    'subject_id' => $validated['subject_id'],
                ],
                [
                    'tugas' => $item['tugas'],
                    'pts' => $item['pts'],
                    'pas' => $item['pas'],
                ]
            );
        }

        return redirect()->route('dashboard')->with('success', 'Scores saved successfully!');
    }

    /** Statistik kehadiran per siswa (dipakai layar input & export). */
    private function buildAttendanceStats(Classroom $classroom, $students): array
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

    private function predikat(int $final): string
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
