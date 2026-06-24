<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedTinyInteger('weight_kehadiran')->default(30)->after('subscription_ends_at');
            $table->unsignedTinyInteger('weight_tugas')->default(20)->after('weight_kehadiran');
            $table->unsignedTinyInteger('weight_pts')->default(10)->after('weight_tugas');
            $table->unsignedTinyInteger('weight_pas')->default(40)->after('weight_pts');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['weight_kehadiran', 'weight_tugas', 'weight_pts', 'weight_pas']);
        });
    }
};
