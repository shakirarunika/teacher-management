<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class GradingWeightController extends Controller
{
    public function update(Request $request)
    {
        $data = $request->validate([
            'weight_kehadiran' => 'required|integer|min:0|max:100',
            'weight_tugas' => 'required|integer|min:0|max:100',
            'weight_pts' => 'required|integer|min:0|max:100',
            'weight_pas' => 'required|integer|min:0|max:100',
        ]);

        if (array_sum($data) !== 100) {
            return back()->withErrors(['weight_pas' => 'Total bobot harus tepat 100%.']);
        }

        $request->user()->update($data);

        return back()->with('success', 'Bobot penilaian berhasil diperbarui!');
    }
}
