<?php

namespace Tests\Feature;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoDynamicSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_robots_txt_respects_ai_crawlers_settings(): void
    {
        // 1. Set AI crawlers allowed
        Setting::setValue('allow_ai_crawlers', '1');
        
        $response = $this->get('/robots.txt');
        $response->assertOk();
        $this->assertStringContainsString('User-agent: GPTBot', $response->getContent());
        $this->assertStringContainsString('Allow: /', $response->getContent());

        // 2. Set AI crawlers blocked
        Setting::setValue('allow_ai_crawlers', '0');
        
        $response = $this->get('/robots.txt');
        $response->assertOk();
        $this->assertStringContainsString('User-agent: GPTBot', $response->getContent());
        $this->assertStringContainsString('Disallow: /', $response->getContent());
        // Standard Googlebot should still be allowed
        $this->assertStringContainsString("User-agent: Googlebot\nAllow: /", $response->getContent());
    }

    public function test_robots_txt_appends_extra_rules(): void
    {
        Setting::setValue('robots_extra', "Disallow: /secret-vault/\nDisallow: /temp-files/");

        $response = $this->get('/robots.txt');
        $response->assertOk();
        $this->assertStringContainsString('Disallow: /secret-vault/', $response->getContent());
        $this->assertStringContainsString('Disallow: /temp-files/', $response->getContent());
    }

    public function test_sitemap_respects_exclusions_and_frequency(): void
    {
        // 1. Set sitemap settings
        Setting::setValue('sitemap_frequency', 'weekly');
        Setting::setValue('sitemap_include_achievements', '0');
        Setting::setValue('sitemap_include_extracurriculars', '0');

        $response = $this->get('/sitemap.xml');
        $response->assertOk();
        
        // Homepage should have the weekly changefreq
        $this->assertStringContainsString('<loc>' . config('app.url') . '/</loc><lastmod>', $response->getContent());
        $this->assertStringContainsString('<changefreq>weekly</changefreq><priority>1.0</priority>', $response->getContent());

        // Achievements and extracurriculars page links should NOT be in sitemap
        $this->assertStringNotContainsString(config('app.url') . '/prestasi', $response->getContent());
        $this->assertStringNotContainsString(config('app.url') . '/ekstrakurikuler', $response->getContent());

        // 2. Enable achievements and extracurriculars
        Setting::setValue('sitemap_include_achievements', '1');
        Setting::setValue('sitemap_include_extracurriculars', '1');

        $response = $this->get('/sitemap.xml');
        $response->assertOk();

        // Pages should now be in the sitemap
        $this->assertStringContainsString('<loc>' . config('app.url') . '/prestasi</loc>', $response->getContent());
        $this->assertStringContainsString('<loc>' . config('app.url') . '/ekstrakurikuler</loc>', $response->getContent());
    }
}
