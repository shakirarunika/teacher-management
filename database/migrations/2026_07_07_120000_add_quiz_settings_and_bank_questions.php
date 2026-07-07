<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->unsignedSmallInteger('duration_minutes')->nullable()->after('is_open'); // null = tanpa timer
            $table->dateTime('opens_at')->nullable()->after('duration_minutes');
            $table->dateTime('closes_at')->nullable()->after('opens_at');
            $table->boolean('shuffle_questions')->default(false)->after('closes_at');
            $table->boolean('shuffle_options')->default(false)->after('shuffle_questions');
            $table->boolean('show_result')->default(true)->after('shuffle_options'); // false = mode ujian
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->unsignedInteger('duration_seconds')->nullable()->after('score');
        });

        Schema::create('bank_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->string('materi')->nullable(); // bab/topik, teks bebas
            $table->string('difficulty', 10)->nullable(); // mudah|sedang|sulit
            $table->text('q');
            $table->json('options');
            $table->unsignedTinyInteger('answer');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_questions');
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropColumn('duration_seconds');
        });
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn(['duration_minutes', 'opens_at', 'closes_at', 'shuffle_questions', 'shuffle_options', 'show_result']);
        });
    }
};
