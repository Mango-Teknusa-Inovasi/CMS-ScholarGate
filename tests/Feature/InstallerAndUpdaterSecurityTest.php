<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\Installer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class InstallerAndUpdaterSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
        // Ensure lock file is cleaned up before and after tests
        Installer::removeLockFile();
    }

    protected function tearDown(): void
    {
        Installer::removeLockFile();
        parent::tearDown();
    }

    public function test_installer_is_blocked_when_lock_file_exists(): void
    {
        // Simulate app already installed by writing the lock file
        Installer::markInstalled();
        $this->assertTrue(Installer::isInstalled());

        // GET /install should redirect to /
        $this->get('/install')->assertRedirect('/');

        // POST /install should redirect to /
        $this->post('/install', [])->assertRedirect('/');
    }

    public function test_installer_blocks_reinstall_when_db_contains_users(): void
    {
        // Create an admin user to trigger looksInstalled() without lock file
        User::factory()->create(['role' => 'admin']);
        $this->assertTrue(Installer::looksInstalled());

        // If ALLOW_INSTALL is false (default), installer web page should be locked
        config(['app.env' => 'production']);
        $this->get('/install')
            ->assertStatus(403)
            ->assertSeeText('Database sudah berisi data');

        // POST /install should also be locked
        $this->post('/install', [])->assertStatus(403);
    }

    public function test_updater_requires_installed_app(): void
    {
        // When not installed, updater redirects to installer
        $this->get('/update')->assertRedirect(route('install.show'));
        $this->post('/update', [])->assertRedirect(route('install.show'));
    }

    public function test_updater_requires_super_admin_credentials(): void
    {
        // Simulate installed state
        Installer::markInstalled();

        // 1. Unauthenticated / incorrect credentials
        $response = $this->post('/update', [
            'email' => 'wrong@example.com',
            'password' => 'wrongpassword',
            'confirm' => '1',
        ]);
        $response->assertSessionHasErrors(['email']);

        // 2. Authenticated as non-super admin (editor)
        $editor = User::factory()->create([
            'email' => 'editor@scholargate.test',
            'password' => 'password123',
            'role' => 'editor',
        ]);

        $response = $this->post('/update', [
            'email' => 'editor@scholargate.test',
            'password' => 'password123',
            'confirm' => '1',
        ]);
        $response->assertSessionHasErrors(['email']);

        // 3. Authenticated as super admin (admin role)
        $admin = User::factory()->create([
            'email' => 'admin@scholargate.test',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $response = $this->post('/update', [
            'email' => 'admin@scholargate.test',
            'password' => 'password123',
            'confirm' => '1',
            'optimize' => '0', // skip caching in tests to avoid side-effects
        ]);

        $response->assertRedirect(route('update.show'));
        $response->assertSessionHasNoErrors();
    }
}
