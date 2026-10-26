<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Banner;
use App\Models\Media;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_api_payload_shape(): void
    {
        $response = $this->getJson('/api/v1/home');

        $response->assertOk()
            ->assertJsonStructure([
                'settings',
                'banners',
                'welcome',
                'services',
                'articles',
                'achievements',
                'gallery',
                'partners',
            ]);
    }

    public function test_home_api_includes_additive_responsive_image_sources(): void
    {
        Media::create([
            'path' => 'uploads/test-banner.webp',
            'filename' => 'test-banner.webp',
            'disk' => 'public',
            'mime' => 'image/webp',
            'size' => 1000,
            'width' => 1200,
            'height' => 600,
            'optimized' => true,
            'variants' => [320 => 'uploads/test-banner-w320.webp', 640 => 'uploads/test-banner-w640.webp'],
        ]);
        Banner::create([
            'title' => 'Banner uji',
            'image_path' => 'uploads/test-banner.webp',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $response = $this->getJson('/api/v1/home')->assertOk();
        $srcset = $response->json('banners.0.image_srcset');

        $this->assertStringContainsString('test-banner-w320.webp 320w', $srcset);
        $this->assertStringContainsString('test-banner.webp 1200w', $srcset);
        $response->assertJsonStructure(['banners' => [['image_path', 'image_url', 'image_srcset']]]);
    }

    public function test_public_settings_only_exposes_whitelist(): void
    {
        $response = $this->getJson('/api/v1/settings/public');

        $response->assertOk();
        $data = $response->json();
        $this->assertIsArray($data);
        $this->assertArrayNotHasKey('app_key', $data);
        $this->assertArrayNotHasKey('DB_PASSWORD', $data);
    }

    public function test_articles_list_is_public(): void
    {
        $this->getJson('/api/v1/articles')->assertOk();
    }
}
