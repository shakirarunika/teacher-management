<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceReportController;
use App\Http\Controllers\ScoreController;
use App\Http\Controllers\HolidayController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Attendance Routes
    Route::get('/classrooms/{classroom}/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
    Route::post('/classrooms/{classroom}/attendance', [AttendanceController::class, 'store'])->name('attendance.store');
    
    // Attendance Report Route
    Route::get('/classrooms/{classroom}/attendance/report', [AttendanceReportController::class, 'show'])->name('attendance.report');

    // Score Routes
    Route::get('/classrooms/{classroom}/scores', [ScoreController::class, 'index'])->name('scores.index');
    Route::post('/classrooms/{classroom}/scores', [ScoreController::class, 'store'])->name('scores.store');

    // Holiday Routes
    Route::get('/holidays', [HolidayController::class, 'index'])->name('holidays.index');
    Route::post('/holidays', [HolidayController::class, 'store'])->name('holidays.store');
    Route::post('/holidays/sync', [HolidayController::class, 'sync'])->name('holidays.sync');
    Route::delete('/holidays/{holiday}', [HolidayController::class, 'destroy'])->name('holidays.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
