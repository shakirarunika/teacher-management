<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_questions', function (Blueprint $table) {
            $table->string('type', 10)->default('pg')->after('difficulty'); // pg|isian|jodoh|esai
            $table->json('options')->nullable()->change();        // hanya pg
            $table->unsignedTinyInteger('answer')->nullable()->change(); // hanya pg
            $table->string('answer_text', 500)->nullable()->after('answer'); // kunci isian, alternatif dipisah |
            $table->json('pairs')->nullable()->after('answer_text'); // [{left, right}] untuk menjodohkan
        });
    }

    public function down(): void
    {
        Schema::table('bank_questions', function (Blueprint $table) {
            $table->dropColumn(['type', 'answer_text', 'pairs']);
        });
    }
};
