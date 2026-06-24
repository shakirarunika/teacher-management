<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    // OwnerScope memastikan binding {classroom} hanya cocok untuk kelas milik guru yang login.

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);

        Classroom::create(['name' => $request->name]); // teacher_id diisi otomatis oleh BelongsToOwner

        return back()->with('success', 'Kelas berhasil ditambahkan!');
    }

    public function update(Request $request, Classroom $classroom)
    {
        $request->validate(['name' => 'required|string|max:255']);

        $classroom->update(['name' => $request->name]);

        return back()->with('success', 'Kelas berhasil diperbarui!');
    }

    public function destroy(Classroom $classroom)
    {
        // Cascade FK ikut menghapus pivot siswa, absensi, dan nilai kelas ini.
        $classroom->delete();

        return back()->with('success', 'Kelas berhasil dihapus!');
    }
}
