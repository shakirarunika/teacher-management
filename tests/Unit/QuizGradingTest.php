<?php

namespace Tests\Unit;

use App\Models\Quiz;
use Tests\TestCase;

class QuizGradingTest extends TestCase
{
    private function quiz(array $questions): Quiz
    {
        return new Quiz(['questions' => $questions]);
    }

    public function test_pg_dinilai_benar_salah(): void
    {
        $quiz = $this->quiz([
            ['q' => '1+1?', 'options' => ['1', '2'], 'answer' => 1],
            ['type' => 'pg', 'q' => '2+2?', 'options' => ['4', '5'], 'answer' => 0],
        ]);

        $g = $quiz->gradeAnswers([1, 1]);
        $this->assertSame(50, $g['score']);
        $this->assertTrue($g['review'][0]['correct']);
        $this->assertFalse($g['review'][1]['correct']);
    }

    public function test_isian_normalisasi_dan_alternatif(): void
    {
        $quiz = $this->quiz([
            ['type' => 'isian', 'q' => 'Ibukota RI?', 'answer' => 'Jakarta|DKI Jakarta'],
        ]);

        $this->assertSame(100, $quiz->gradeAnswers(['  jakarta '])['score']);
        $this->assertSame(100, $quiz->gradeAnswers(['dki   JAKARTA'])['score']);
        $this->assertSame(0, $quiz->gradeAnswers(['Bandung'])['score']);
        $this->assertSame(0, $quiz->gradeAnswers([null])['score']);
    }

    public function test_jodoh_nilai_parsial_per_pasangan(): void
    {
        $quiz = $this->quiz([
            ['type' => 'jodoh', 'q' => 'Jodohkan', 'pairs' => [
                ['left' => 'A', 'right' => '1'],
                ['left' => 'B', 'right' => '2'],
                ['left' => 'C', 'right' => '3'],
                ['left' => 'D', 'right' => '4'],
            ]],
        ]);

        // 2 dari 4 pasangan benar (kunci: index kiri = index kanan asli)
        $g = $quiz->gradeAnswers([[0, 1, 0, 1]]);
        $this->assertSame(50, $g['score']);
        $this->assertSame(2, $g['review'][0]['matched']);
        $this->assertFalse($g['review'][0]['correct']);

        $this->assertSame(100, $quiz->gradeAnswers([[0, 1, 2, 3]])['score']);
    }

    public function test_esai_belum_dinilai_tidak_masuk_pembagi_lalu_dihitung_ulang(): void
    {
        $quiz = $this->quiz([
            ['q' => '1+1?', 'options' => ['1', '2'], 'answer' => 1],
            ['type' => 'esai', 'q' => 'Jelaskan!'],
        ]);
        $answers = [1, 'Karena begini...'];

        // Sebelum dinilai: skor sementara hanya dari soal otomatis
        $g = $quiz->gradeAnswers($answers);
        $this->assertSame(100, $g['score']);
        $this->assertSame(1, $g['pending_essays']);
        $this->assertTrue($g['review'][1]['pending']);

        // Setelah guru menilai esai 60: (1 + 0.6) / 2 = 80
        $g = $quiz->gradeAnswers($answers, [1 => 60]);
        $this->assertSame(80, $g['score']);
        $this->assertSame(0, $g['pending_essays']);
    }
}
