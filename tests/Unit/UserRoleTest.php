<?php

namespace Tests\Unit;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserRoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_helpers(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $editor = User::factory()->create(['role' => 'editor']);
        $member = User::factory()->create(['role' => 'member']);

        $this->assertTrue($admin->isAdmin());
        $this->assertTrue($admin->isSuperAdmin());

        $this->assertTrue($editor->isAdmin());
        $this->assertFalse($editor->isSuperAdmin());

        $this->assertFalse($member->isAdmin());
        $this->assertFalse($member->isSuperAdmin());
        $this->assertTrue($member->isMember());
    }

    public function test_password_is_hashed_once_via_cast(): void
    {
        $user = User::factory()->create([
            'password' => 'PlainSecret123!',
        ]);

        $raw = $user->getRawOriginal('password');
        $this->assertNotSame('PlainSecret123!', $raw);
        $this->assertTrue(password_verify('PlainSecret123!', $raw));
    }
}
