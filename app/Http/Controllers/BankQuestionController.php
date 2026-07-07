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
            'options' => 'required|array|min:2|max:5',
            'options.*' => 'required|string|max:500',
            'answer' => 'required|integer|min:0',
        ]);

        if ($validated['answer'] >= count($validated['options'])) {
            abort(422, 'Kunci jawaban tidak valid.');
        }

        return $validated;
    }
}
