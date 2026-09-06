<?php

namespace Tests\Unit;

use App\Models\Article;
use App\Models\Plugin;
use App\Models\Tag;
use App\Services\BackupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class BackupServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_backup_creates_portable_archive_handling_composite_keys_and_plugins(): void
    {
        $service = app(BackupService::class);

        // Seed an article with tag (populates article_tag composite pivot table)
        $article = Article::create([
            'title' => 'Judul Uji Backup',
            'slug' => 'judul-uji-backup',
            'body' => '<p>Konten artikel untuk backup.</p>',
            'status' => 'published',
        ]);
        $tag = Tag::create(['name' => 'Uji', 'slug' => 'uji']);
        $article->tags()->attach($tag->id);

        // Seed a plugin
        Plugin::create([
            'slug' => 'test-plugin',
            'name' => 'Test Plugin',
            'version' => '1.0.0',
            'is_active' => true,
            'manifest' => ['author' => 'ScholarGate'],
            'settings' => ['theme' => 'dark'],
        ]);

        $result = $service->create();

        $this->assertNotEmpty($result['filename']);
        $this->assertFileExists($result['path']);
        $this->assertGreaterThan(0, $result['size']);

        // Clean up generated backup file
        if (File::exists($result['path'])) {
            File::delete($result['path']);
        }
    }

    public function test_backup_restore_from_json_preserves_content_and_plugins(): void
    {
        $service = app(BackupService::class);

        $jsonPayload = json_encode([
            'app' => 'scholargate',
            'version' => BackupService::FORMAT_VERSION,
            'portable' => true,
            'source_connection' => 'mysql',
            'tables' => [
                'articles' => [
                    [
                        'id' => '01a07503-aa64-70d3-a9ac-7c5f79369590',
                        'title' => 'Artikel Restore',
                        'slug' => 'artikel-restore',
                        'body' => '<p>Konten yang di-restore.</p>',
                        'status' => 'published',
                        'is_featured' => 1,
                        'published_at' => '2026-09-01T10:00:00+07:00',
                    ],
                ],
                'plugins' => [
                    [
                        'slug' => 'portal-addon',
                        'name' => 'Portal Addon',
                        'version' => '1.2.0',
                        'is_active' => true,
                        'manifest' => ['type' => 'feature'],
                        'settings' => ['enabled' => true],
                    ],
                ],
            ],
        ]);

        // In replace mode, systemSettingTables (including plugins) are restored
        $res = $service->restoreFromJson($jsonPayload, 'replace');

        $this->assertGreaterThan(0, $res['rows']);
        $this->assertDatabaseHas('articles', ['title' => 'Artikel Restore']);
        $this->assertDatabaseHas('plugins', ['slug' => 'portal-addon', 'version' => '1.2.0']);
    }
}
