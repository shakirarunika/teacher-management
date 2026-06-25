<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    // OwnerScope membatasi {subject} ke milik guru yang login & mengisi user_id otomatis.

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
        ]);

        Subject::create($request->only('name', 'code'));

        return back()->with('success', 'Mata pelajaran ditambahkan!');
    }

    public function update(Request $request, Subject $subject)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
        ]);

        $subject->update($request->only('name', 'code'));

        return back()->with('success', 'Mata pelajaran diperbarui!');
    }

    public function destroy(Subject $subject)
    {
        // Nilai terkait ikut terhapus (cascade FK subject_id).
        $subject->delete();

        return back()->with('success', 'Mata pelajaran dihapus!');
    }
}
