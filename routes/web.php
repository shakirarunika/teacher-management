<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceReportController;
use App\Http\Controllers\ScoreController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\GradingWeightController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\AcademicYearController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\PublicQuizController;
use App\Http\Controllers\BankQuestionController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

// Halaman billing tetap bisa diakses walau langganan habis (tanpa gate 'subscribed')
Route::middleware('auth')->group(function () {
    Route::get('/billing', [BillingController::class, 'index'])->name('billing');
});

Route::middleware(['auth', 'verified', 'subscribed'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Classroom self-service (guru kelola kelasnya sendiri)
    Route::post('/classrooms', [ClassroomController::class, 'store'])->name('classrooms.store');
    Route::put('/classrooms/{classroom}', [ClassroomController::class, 'update'])->name('classrooms.update');
    Route::delete('/classrooms/{classroom}', [ClassroomController::class, 'destroy'])->name('classrooms.destroy');

    // Student self-service (kelola siswa per kelas)
    Route::get('/classrooms/{classroom}/students', [StudentController::class, 'index'])->name('students.index');
    Route::post('/classrooms/{classroom}/students', [StudentController::class, 'store'])->name('students.store');
    Route::post('/classrooms/{classroom}/students/import', [StudentController::class, 'import'])->name('students.import');
    Route::put('/classrooms/{classroom}/students/{student}', [StudentController::class, 'update'])->name('students.update');
    Route::delete('/classrooms/{classroom}/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');

    // Attendance Routes
    Route::get('/classrooms/{classroom}/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
    Route::post('/classrooms/{classroom}/attendance', [AttendanceController::class, 'store'])->name('attendance.store');
    
    // Attendance Report Route
    Route::get('/classrooms/{classroom}/attendance/report', [AttendanceReportController::class, 'show'])->name('attendance.report');
    Route::get('/classrooms/{classroom}/attendance/report/export', [AttendanceReportController::class, 'export'])->name('attendance.report.export');

    // Score Routes
    Route::get('/classrooms/{classroom}/scores', [ScoreController::class, 'index'])->name('scores.index');
    Route::post('/classrooms/{classroom}/scores', [ScoreController::class, 'store'])->name('scores.store');
    Route::put('/grading-weights', [GradingWeightController::class, 'update'])->name('grading-weights.update');

    // Mata pelajaran self-service (guru kelola mapelnya sendiri)
    Route::post('/subjects', [SubjectController::class, 'store'])->name('subjects.store');
    Route::put('/subjects/{subject}', [SubjectController::class, 'update'])->name('subjects.update');
    Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy'])->name('subjects.destroy');

    // Tahun ajaran self-service
    Route::post('/academic-years', [AcademicYearController::class, 'store'])->name('academic-years.store');
    Route::put('/academic-years/{academicYear}', [AcademicYearController::class, 'update'])->name('academic-years.update');
    Route::put('/academic-years/{academicYear}/activate', [AcademicYearController::class, 'activate'])->name('academic-years.activate');
    Route::delete('/academic-years/{academicYear}', [AcademicYearController::class, 'destroy'])->name('academic-years.destroy');

    // Kuis online (guru kelola, siswa kerjakan via link publik)
    Route::get('/classrooms/{classroom}/quizzes', [QuizController::class, 'index'])->name('quizzes.index');
    Route::post('/classrooms/{classroom}/quizzes', [QuizController::class, 'store'])->name('quizzes.store');
    Route::put('/quizzes/{quiz}', [QuizController::class, 'update'])->name('quizzes.update');
    Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy'])->name('quizzes.destroy');
    Route::get('/quizzes/{quiz}/results', [QuizController::class, 'results'])->name('quizzes.results');
    Route::post('/quizzes/{quiz}/copy-scores', [QuizController::class, 'copyScores'])->name('quizzes.copy-scores');
    Route::post('/quizzes/{quiz}/duplicate', [QuizController::class, 'duplicate'])->name('quizzes.duplicate');

    // Bank Soal (global per guru, tidak terikat kelas)
    Route::get('/bank-soal', [BankQuestionController::class, 'index'])->name('bank-questions.index');
    Route::get('/bank-soal/list', [BankQuestionController::class, 'list'])->name('bank-questions.list');
    Route::post('/bank-soal', [BankQuestionController::class, 'store'])->name('bank-questions.store');
    Route::put('/bank-soal/{bankQuestion}', [BankQuestionController::class, 'update'])->name('bank-questions.update');
    Route::delete('/bank-soal/{bankQuestion}', [BankQuestionController::class, 'destroy'])->name('bank-questions.destroy');

    // Holiday Routes
    Route::get('/holidays', [HolidayController::class, 'index'])->name('holidays.index');
    Route::post('/holidays', [HolidayController::class, 'store'])->name('holidays.store');
    Route::post('/holidays/sync', [HolidayController::class, 'sync'])->name('holidays.sync');
    Route::delete('/holidays/{holiday}', [HolidayController::class, 'destroy'])->name('holidays.destroy');
});

// Kuis publik — siswa akses tanpa login via token acak
Route::get('/kuis/{token}', [PublicQuizController::class, 'show'])->name('quiz.take');
Route::post('/kuis/{token}', [PublicQuizController::class, 'submit'])
    ->middleware('throttle:20,1')
    ->name('quiz.submit');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
