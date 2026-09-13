<?php

namespace Tests\Feature;

use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MediaPickerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_and_filter_media_by_type_and_search(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        Media::create([
            'filename' => 'banner-sekolah.webp',
            'original_filename' => 'banner-sekolah.png',
            'path' => 'uploads/2026/09/banner.webp',
            'mime' => 'image/webp',
            'size' => 120000,
            'alt' => 'Banner Sekolah Gedeg',
            'width' => 1920,
            'height' => 800,
            'optimized' => true,
        ]);

        Media::create([
            'filename' => 'panduan-ppdb.pdf',
            'original_filename' => 'panduan-ppdb.pdf',
            'path' => 'uploads/2026/09/panduan.pdf',
            'mime' => 'application/pdf',
            'size' => 450000,
            'alt' => 'Brosur Panduan PPDB',
            'width' => null,
            'height' => null,
            'optimized' => false,
        ]);

        // List all
        $resAll = $this->getJson('/api/v1/admin/media-library');
        $resAll->assertOk();
        $this->assertCount(2, $resAll->json('data'));

        // Filter image only
        $resImg = $this->getJson('/api/v1/admin/media-library?type=image');
        $resImg->assertOk();
        $this->assertCount(1, $resImg->json('data'));
        $this->assertSame('banner-sekolah.webp', $resImg->json('data.0.filename'));

        // Filter document only
        $resDoc = $this->getJson('/api/v1/admin/media-library?type=document');
        $resDoc->assertOk();
        $this->assertCount(1, $resDoc->json('data'));
        $this->assertSame('panduan-ppdb.pdf', $resDoc->json('data.0.filename'));

        // Search query
        $resSearch = $this->getJson('/api/v1/admin/media-library?q=Banner');
        $resSearch->assertOk();
        $this->assertCount(1, $resSearch->json('data'));
        $this->assertSame('Banner Sekolah Gedeg', $resSearch->json('data.0.alt'));
    }

    public function test_can_update_media_alt_text(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $media = Media::create([
            'filename' => 'foto-guru.webp',
            'original_filename' => 'foto-guru.jpg',
            'path' => 'uploads/2026/09/guru.webp',
            'mime' => 'image/webp',
            'size' => 85000,
            'alt' => 'Guru Lama',
            'width' => 800,
            'height' => 600,
            'optimized' => true,
        ]);

        $res = $this->putJson("/api/v1/admin/media-library/{$media->id}", [
            'alt' => 'Dewan Guru SMAN 1 Gedeg',
        ]);

        $res->assertOk();
        $this->assertDatabaseHas('media', [
            'id' => $media->id,
            'alt' => 'Dewan Guru SMAN 1 Gedeg',
        ]);
    }
}
