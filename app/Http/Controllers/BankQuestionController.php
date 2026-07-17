<?php

namespace App\Http\Controllers;

use App\Models\BankQuestion;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BankQuestionController extends Controller
{
    // OwnerScope membatasi {bankQuestion} & listing ke milik guru yang login.

    public function index()
    {
        return Inertia::render('BankQuestions/Index', [
            // ponytail: kirim semua lalu filter di client — bank soal per guru
            // ratusan baris paling banyak. Pagination kalau sudah ribuan.
            'questions' => BankQuestion::with('subject:id,name')->latest()->get(),
            'subjects' => Subject::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /** JSON untuk picker "Ambil dari Bank Soal" di builder kuis. */
    public function list()
    {
        return BankQuestion::with('subject:id,name')->latest()->get();
    }

    public function store(Request $request)
    {
        BankQuestion::create($this->validateQuestion($request));

        return back()->with('success', 'Soal disimpan ke bank soal!');
    }

    public function update(Request $request, BankQuestion $bankQuestion)
    {
        $bankQuestion->update($this->validateQuestion($request));

        return back()->with('success', 'Soal berhasil diperbarui!');
    }

    public function destroy(BankQuestion $bankQuestion)
    {
        $bankQuestion->delete();

        return back()->with('success', 'Soal dihapus dari bank.');
    }

    private function validateQuestion(Request $request): array
    {
        $validated = $request->validate([
            'subject_id' => ['required', Rule::exists('subjects', 'id')->where('user_id', $request->user()->id)],
            'materi' => 'nullable|string|max:255',
            'difficulty' => ['nullable', Rule::in(['mudah', 'sedang', 'sulit'])],
            'q' => 'required|string|max:1000',
            'stimulus' => 'nullable|string|max:5000',
            'media' => 'nullable|array',
            'media.type' => 'required_with:media|in:image,audio,youtube',
            'media.url' => 'required_with:media|string|max:1000',
            'type' => 'nullable|in:pg,isian,jodoh,esai',
            'options' => 'nullable|array|max:5',
            'options.*' => 'required|string|max:500',
            'answer' => 'nullable|integer|min:0',
            'answer_text' => 'nullable|string|max:500',
            'pairs' => 'nullable|array|max:10',
            'pairs.*.left' => 'required|string|max:500',
            'pairs.*.right' => 'required|string|max:500',
        ]);

        $type = $validated['type'] ?? 'pg';
        switch ($type) {
            case 'isian':
                if (trim($validated['answer_text'] ?? '') === '') {
                    abort(422, 'Kunci jawaban isian wajib diisi.');
                }
                break;
            case 'jodoh':
                if (count($validated['pairs'] ?? []) < 2) {
                    abort(422, 'Menjodohkan minimal 2 pasangan.');
                }
                break;
            case 'esai':
                break;
            default: // pg
                if (count($validated['options'] ?? []) < 2) {
                    abort(422, 'Minimal 2 pilihan jawaban.');
                }
                if (($validated['answer'] ?? null) === null || $validated['answer'] >= count($validated['options'])) {
                    abort(422, 'Kunci jawaban tidak valid.');
                }
        }

        // Field yang tidak relevan di-null-kan supaya ganti tipe saat edit
        // tidak meninggalkan data lama.
        return array_merge($validated, [
            'type' => $type,
            'options' => $type === 'pg' ? $validated['options'] : null,
            'answer' => $type === 'pg' ? $validated['answer'] : null,
            'answer_text' => $type === 'isian' ? $validated['answer_text'] : null,
            'pairs' => $type === 'jodoh' ? $validated['pairs'] : null,
        ]);
    }
}
