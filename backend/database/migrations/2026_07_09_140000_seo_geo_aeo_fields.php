<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->string('focus_keyword')->nullable()->after('meta_description');
            $table->string('canonical_url')->nullable()->after('focus_keyword');
            $table->string('og_image')->nullable()->after('canonical_url');
            $table->boolean('noindex')->default(false)->after('og_image');
            $table->json('faq_items')->nullable()->after('noindex'); // AEO: Q&A pairs
        });

        Schema::table('media', function (Blueprint $table) {
            $table->boolean('optimized')->default(false)->after('height');
            $table->string('original_filename')->nullable()->after('filename');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn([
                'focus_keyword', 'canonical_url', 'og_image', 'noindex', 'faq_items',
            ]);
        });

        Schema::table('media', function (Blueprint $table) {
            $table->dropColumn(['optimized', 'original_filename']);
        });
    }
};
