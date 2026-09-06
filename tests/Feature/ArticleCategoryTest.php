<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ArticleCategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_category_via_admin_api(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/admin/categories', [
            'name' => 'Prestasi Akademik',
        ]);

        $response->assertCreated();
        $this->assertSame('Prestasi Akademik', $response->json('name'));
        $this->assertSame('prestasi-akademik', $response->json('slug'));
        $this->assertDatabaseHas('categories', ['name' => 'Prestasi Akademik']);
    }

    public function test_can_save_article_with_existing_category_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $cat = Category::create(['name' => 'Olahraga', 'slug' => 'olahraga']);

        $response = $this->postJson('/api/v1/admin/articles', [
            'title' => 'Pertandingan Voli Antar SMA',
            'category_id' => $cat->id,
            'body' => '<p>Konten berita.</p>',
            'status' => 'published',
        ]);

        $response->assertCreated();
        $this->assertSame($cat->id, $response->json('category_id'));
        $this->assertSame('Olahraga', $response->json('category.name'));
    }

    public function test_can_auto_resolve_category_by_name_when_id_is_empty(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/admin/articles', [
            'title' => 'Kunjungan Industri Siswa',
            'category_name' => 'Kunjungan Industri',
            'body' => '<p>Kunjungan ke pabrik manufaktur.</p>',
            'status' => 'draft',
        ]);

        $response->assertCreated();
        $this->assertNotNull($response->json('category_id'));
        $this->assertSame('Kunjungan Industri', $response->json('category.name'));
        $this->assertDatabaseHas('categories', ['name' => 'Kunjungan Industri']);
    }
}
