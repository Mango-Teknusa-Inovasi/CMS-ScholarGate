<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->json('ppid_roles')->nullable());
        Schema::create('ppid_settings', function (Blueprint $t) {
            $t->id();
            $t->json('data');
            $t->timestamps();
        });
        Schema::create('ppid_forms', function (Blueprint $t) {
            $t->id();
            $t->string('kind');
            $t->unsignedInteger('version');
            $t->json('fields');
            $t->boolean('active')->default(true);
            $t->timestamps();
            $t->unique(['kind', 'version']);
        });
        Schema::create('ppid_documents', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('title');
            $t->text('summary')->nullable();
            $t->string('classification');
            $t->string('category')->nullable();
            $t->unsignedSmallInteger('year')->nullable();
            $t->string('owner')->nullable();
            $t->string('retention')->nullable();
            $t->string('format')->nullable();
            $t->string('source')->default('upload');
            $t->text('source_url')->nullable();
            $t->text('physical_location')->nullable();
            $t->string('status')->default('draft');
            $t->json('published_snapshot')->nullable();
            $t->unsignedInteger('version')->default(0);
            $t->string('origin')->default('manual');
            $t->timestamps();
        });
        Schema::create('ppid_submissions', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('register')->unique();
            $t->string('kind');
            $t->string('access_hash');
            $t->longText('answers');
            $t->json('form_snapshot');
            $t->uuid('parent_id')->nullable();
            $t->string('channel')->default('online');
            $t->string('status')->default('received');
            $t->string('outcome')->nullable();
            $t->timestamp('received_at');
            $t->date('due_at')->nullable();
            $t->boolean('extended')->default(false);
            $t->timestamps();
        });
        Schema::create('ppid_files', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->uuid('document_id')->nullable()->index();
            $t->uuid('submission_id')->nullable()->index();
            $t->string('field')->nullable();
            $t->string('name');
            $t->string('mime');
            $t->unsignedBigInteger('size');
            $t->string('checksum', 64);
            $t->string('disk');
            $t->text('storage_location');
            $t->text('object_key');
            $t->string('public_disk')->nullable();
            $t->text('public_location')->nullable();
            $t->text('public_key')->nullable();
            $t->unsignedInteger('version')->default(1);
            $t->boolean('recipient_visible')->default(true);
            $t->timestamps();
        });
        Schema::create('ppid_events', function (Blueprint $t) {
            $t->id();
            $t->uuid('submission_id')->nullable()->index();
            $t->uuid('document_id')->nullable();
            $t->uuid('actor_id')->nullable();
            $t->string('action');
            $t->text('message')->nullable();
            $t->boolean('public')->default(false);
            $t->timestamps();
        });
        Schema::create('ppid_notifications', function (Blueprint $t) {
            $t->id();
            $t->uuid('submission_id');
            $t->text('recipient');
            $t->text('message');
            $t->string('state')->default('pending');
            $t->unsignedInteger('attempts')->default(0);
            $t->timestamp('sent_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['notifications', 'events', 'files', 'submissions', 'documents', 'forms', 'settings'] as $table) {
            Schema::dropIfExists('ppid_'.$table);
        }
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('ppid_roles'));
    }
};
