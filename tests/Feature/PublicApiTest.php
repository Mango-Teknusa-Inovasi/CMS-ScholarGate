<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
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
