<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class HomePageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Treat app as installed so / does not redirect to installer
        File::ensureDirectoryExists(storage_path('app'));
        File::put(storage_path('app/installed'), now()->toIso8601String());
    }

    protected function tearDown(): void
    {
        File::delete(storage_path('app/installed'));
        parent::tearDown();
    }

    public function test_home_returns_inertia_document(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('HomePage', false);
        $response->assertSee('data-page', false);
    }

    public function test_seo_endpoints_are_public(): void
    {
        $this->get('/robots.txt')->assertOk();
        $this->get('/sitemap.xml')->assertOk();
        $this->get('/llms.txt')->assertOk();
    }

    public function test_admin_guest_is_redirected_to_login(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
    }
}
