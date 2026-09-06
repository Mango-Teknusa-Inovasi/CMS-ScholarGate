<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('article_tag', 'id')) {
            $driver = DB::getDriverName();
            if (in_array($driver, ['mysql', 'mariadb'])) {
                DB::statement('ALTER TABLE article_tag DROP PRIMARY KEY, DROP COLUMN id');
            } else {
                Schema::table('article_tag', function (Blueprint $table) {
                    $table->dropColumn('id');
                });
            }
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('article_tag', 'id')) {
            Schema::table('article_tag', function (Blueprint $table) {
                $table->uuid('id')->nullable();
            });
        }
    }
};
