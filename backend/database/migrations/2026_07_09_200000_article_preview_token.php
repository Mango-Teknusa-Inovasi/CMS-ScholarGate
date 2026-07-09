<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->string('preview_token', 64)->nullable()->unique()->after('slug');
            $table->timestamp('preview_token_expires_at')->nullable()->after('preview_token');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn(['preview_token', 'preview_token_expires_at']);
        });
    }
};
