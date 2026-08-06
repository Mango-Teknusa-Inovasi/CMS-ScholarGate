<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_admin_api_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
    }

    public function test_settings_public_ignores_unknown_secrets(): void
    {
        // Seed a non-whitelisted key via model (simulating DB pollution)
        \App\Models\Setting::setValue('site_name', 'Secure School');
        \App\Models\Setting::setValue('secret_token_should_not_leak', 'LEAKME');

        $response = $this->getJson('/api/v1/settings/public');
        $response->assertOk();
        $this->assertSame('Secure School', $response->json('site_name'));
        $this->assertArrayNotHasKey('secret_token_should_not_leak', $response->json());
    }

    public function test_editor_cannot_access_super_admin_users_api(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);
        Sanctum::actingAs($editor);

        $this->getJson('/api/v1/admin/users')->assertForbidden();
    }

    public function test_super_admin_can_list_users(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $this->getJson('/api/v1/admin/users')->assertOk();
    }
}
