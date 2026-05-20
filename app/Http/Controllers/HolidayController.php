<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class HolidayController extends Controller
{
    /**
     * Display a listing of holidays.
     */
    public function index(Request $request)
    {
        $month = $request->query('month', Carbon::today()->format('m'));
        $year = $request->query('year', Carbon::today()->format('Y'));

        $holidays = Holiday::whereMonth('date', $month)
            ->whereYear('date', $year)
            ->orderBy('date', 'asc')
            ->get();

        return Inertia::render('Holidays/Index', [
            'holidays' => $holidays,
            'filters' => [
                'month' => $month,
                'year' => $year,
            ]
        ]);
    }

    /**
     * Store a newly created holiday in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date|unique:holidays,date',
            'name' => 'required|string|max:255',
            'type' => 'required|in:Nasional,Internal',
        ], [
            'date.unique' => 'Tanggal ini sudah terdaftar sebagai hari libur.',
        ]);

        Holiday::create($validated);

        return redirect()->back()->with('success', 'Hari libur berhasil ditambahkan!');
    }

    /**
     * Remove the specified holiday from storage.
     */
    public function destroy(Holiday $holiday)
    {
        $holiday->delete();

        return redirect()->back()->with('success', 'Hari libur berhasil dihapus!');
    }

    /**
     * Sync national holidays for a given year.
     */
    public function sync(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        $year = $validated['year'];

        try {
            $response = \Illuminate\Support\Facades\Http::get("https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/calendar.json");
            
            if ($response->successful()) {
                $json = $response->json();
                
                if (is_array($json)) {
                    $count = 0;
                    // Hapus data libur nasional tahun ini terlebih dahulu untuk membersihkan data lama yang salah
                    Holiday::whereYear('date', $year)->where('type', 'Nasional')->delete();

                    foreach ($json as $date => $info) {
                        if (str_starts_with($date, "{$year}-") && isset($info['holiday']) && $info['holiday']) {
                            $rawName = isset($info['summary'][0]) ? $info['summary'][0] : 'Hari Libur Nasional';
                            $name = trim(str_replace([' (belum pasti)', ' (Lebaran Haji)'], '', $rawName));

                            $holiday = Holiday::updateOrCreate(
                                ['date' => $date],
                                [
                                    'name' => $name,
                                    'type' => 'Nasional',
                                ]
                            );
                            if ($holiday->wasRecentlyCreated || $holiday->wasChanged()) {
                                $count++;
                            }
                        }
                    }
                    
                    return redirect()->back()->with('success', "Berhasil sinkronisasi {$count} hari libur nasional untuk tahun {$year}!");
                }
            }
            
            return redirect()->back()->with('error', 'Gagal mengambil data hari libur dari API.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Terjadi kesalahan saat menghubungi API hari libur.');
        }
    }
}
