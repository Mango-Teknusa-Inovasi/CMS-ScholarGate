<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
    }

    public function test_member_login_creates_session_and_token(): void
    {
        $user = User::factory()->create([
            'email' => 'member@test.local',
            'password' => 'Password123!',
            'role' => 'member',
        ]);

        // withSession ensures stateful login works under API + Sanctum
        $response = $this->withSession([])->postJson('/api/v1/auth/member/login', [
            'email' => 'member@test.local',
            'password' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'member@test.local')
            ->assertJsonStructure(['user', 'token', 'message']);

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_admin_login_rejects_member_role(): void
    {
        User::factory()->create([
            'email' => 'member@test.local',
            'password' => 'Password123!',
            'role' => 'member',
        ]);

        $this->postJson('/api/v1/auth/admin/login', [
            'email' => 'member@test.local',
            'password' => 'Password123!',
        ])->assertStatus(422);
    }

    public function test_member_token_cannot_access_admin_dashboard(): void
    {
        $member = User::factory()->create(['role' => 'member']);
        Sanctum::actingAs($member);

        $this->getJson('/api/v1/admin/dashboard')
            ->assertForbidden();
    }

    public function test_admin_token_can_access_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $this->getJson('/api/v1/admin/dashboard')
            ->assertOk();
    }
}
