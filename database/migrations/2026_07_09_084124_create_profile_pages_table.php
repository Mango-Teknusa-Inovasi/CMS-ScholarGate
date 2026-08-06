<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_pages', function (Blueprint $table) {
            $table->id();
            $table->string('title')->default('Profil');
            $table->string('subtitle')->nullable();
            $table->json('tabs')->nullable(); // [{key, label, content_html}]
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_pages');
    }
};
