<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Theme\ThemeManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThemeManagerTest extends TestCase
{
    use RefreshDatabase;

    public function test_theme_manager_discovers_installed_themes(): void
    {
        $manager = app(ThemeManager::class);
        $themes = $manager->discover();

        $this->assertIsArray($themes);
        $this->assertArrayHasKey('default', $themes);
        $this->assertArrayHasKey('classic', $themes);
        $this->assertTrue($themes['default']['is_active']);
    }

    public function test_super_admin_can_list_and_activate_themes(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // 1. List themes
        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/themes');

        $response->assertStatus(200)
            ->assertJsonPath('ok', true)
            ->assertJsonPath('active_theme', 'default');

        // 2. Activate classic theme
        $activateRes = $this->actingAs($admin)
            ->postJson('/api/v1/admin/themes/classic/activate');

        $activateRes->assertStatus(200)
            ->assertJsonPath('ok', true)
            ->assertJsonPath('active_theme', 'classic');

        // Verify active theme setting
        $manager = app(ThemeManager::class);
        $this->assertEquals('classic', $manager->getActiveTheme());

        // 3. Reactivate default theme
        $this->actingAs($admin)
            ->postJson('/api/v1/admin/themes/default/activate')
            ->assertStatus(200);

        $this->assertEquals('default', $manager->getActiveTheme());
    }

    public function test_non_admin_cannot_access_theme_management(): void
    {
        $member = User::factory()->create([
            'role' => 'member',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($member)
            ->getJson('/api/v1/admin/themes')
            ->assertStatus(403);

        $this->actingAs($member)
            ->postJson('/api/v1/admin/themes/classic/activate')
            ->assertStatus(403);
    }
}
