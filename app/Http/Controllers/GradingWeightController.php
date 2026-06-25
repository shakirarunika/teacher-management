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
            'kkm' => 'required|integer|min:1|max:100',
        ]);

        $weightTotal = $data['weight_kehadiran'] + $data['weight_tugas'] + $data['weight_pts'] + $data['weight_pas'];
        if ($weightTotal !== 100) {
            return back()->withErrors(['weight_pas' => 'Total bobot harus tepat 100%.']);
        }

        $request->user()->update($data);

        return back()->with('success', 'Setelan penilaian berhasil diperbarui!');
    }
}
