<?php

namespace Tests\Feature;

use App\Models\Achievement;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ResourceAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_achievement_with_empty_sort_order_and_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $payload = [
            'title' => 'Juara 1 Lomba Paskibra Provinsi',
            'slug' => '',
            'excerpt' => 'Keluarga besar SMAN 1 Gedeg kembali berbangga.',
            'body' => '<p>Perjuangan membuahkan hasil juara 1.</p>',
            'cover_path' => null,
            'badge_label' => 'Juara 1 Provinsi',
            'status' => '',
            'is_featured' => false,
            'sort_order' => '',
        ];

        $response = $this->postJson('/api/v1/admin/achievements', $payload);

        $response->assertCreated();
        $this->assertDatabaseHas('achievements', [
            'title' => 'Juara 1 Lomba Paskibra Provinsi',
            'sort_order' => 0,
            'status' => 'published',
        ]);
    }

    public function test_can_delete_partner(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $partner = Partner::create([
            'name' => 'Mitra Test',
            'logo_path' => null,
            'url' => 'https://example.com',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->deleteJson("/api/v1/admin/partners/{$partner->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('partners', ['id' => $partner->id]);
    }
}
