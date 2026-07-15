<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_questions', function (Blueprint $table) {
            $table->text('stimulus')->nullable()->after('q'); // wacana/teks bacaan
            $table->json('media')->nullable()->after('stimulus'); // {type: image|audio|youtube, url}
        });
    }

    public function down(): void
    {
        Schema::table('bank_questions', function (Blueprint $table) {
            $table->dropColumn(['stimulus', 'media']);
        });
    }
};
