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

    public function test_pgk_semua_pilihan_harus_persis_sama_dengan_kunci(): void
    {
        $quiz = $this->quiz([
            ['type' => 'pgk', 'q' => 'Mana bilangan genap?', 'options' => ['1', '2', '3', '4'], 'answer' => [1, 3]],
        ]);

        $this->assertSame(100, $quiz->gradeAnswers([[3, 1]])['score']); // urutan bebas
        $this->assertSame(0, $quiz->gradeAnswers([[1]])['score']);      // kurang centang
        $this->assertSame(0, $quiz->gradeAnswers([[1, 3, 0]])['score']); // kelebihan centang
        $this->assertSame(0, $quiz->gradeAnswers([null])['score']);
        $this->assertSame([1, 3], $quiz->gradeAnswers([null])['review'][0]['answer']);
    }
}
