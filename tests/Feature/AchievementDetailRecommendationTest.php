<?php

namespace Tests\Feature;

use App\Models\Achievement;
use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AchievementDetailRecommendationTest extends TestCase
{
    use RefreshDatabase;

    public function test_achievement_show_returns_other_achievements_and_recent_articles(): void
    {
        $author = User::factory()->create();
        $category = Category::create([
            'name' => 'Kesiswaan',
            'slug' => 'kesiswaan',
            'color' => '#0ea5e9',
        ]);

        $mainAchievement = Achievement::create([
            'title' => 'Juara 1 LKBB PASSMAGE',
            'slug' => 'juara-1-lkbb-passmage',
            'excerpt' => 'Tim Paskibra kembali mengharumkan nama sekolah.',
            'body' => '<p>Perjuangan membuahkan hasil membanggakan.</p>',
            'cover_path' => 'uploads/2026/09/trophy.webp',
            'badge_label' => 'Juara 1 Provinsi',
            'is_featured' => true,
            'status' => 'published',
            'achieved_at' => now()->subDay(),
        ]);

        $otherAchievement = Achievement::create([
            'title' => 'Juara 2 Debat Bahasa Inggris',
            'slug' => 'juara-2-debat-bahasa-inggris',
            'excerpt' => 'Debat bahasa inggris tingkat daerah.',
            'body' => '<p>Prestasi gemilang lainnya.</p>',
            'cover_path' => 'uploads/2026/09/debate.webp',
            'badge_label' => 'Juara 2 Daerah',
            'is_featured' => false,
            'status' => 'published',
            'achieved_at' => now()->subDays(2),
        ]);

        $article = Article::create([
            'user_id' => $author->id,
            'category_id' => $category->id,
            'title' => 'Peringatan Hari Kemerdekaan RI di Sekolah',
            'slug' => 'peringatan-hari-kemerdekaan-ri-di-sekolah',
            'excerpt' => 'Kemeriahan peringatan HUT RI ke-81.',
            'body' => '<p>Upacara dan berbagai lomba diadakan.</p>',
            'status' => 'published',
            'is_featured' => true,
            'views' => 120,
            'published_at' => now()->subHours(5),
        ]);

        $response = $this->getJson("/api/v1/achievements/{$mainAchievement->slug}");

        $response->assertOk();
        $response->assertJsonPath('title', 'Juara 1 LKBB PASSMAGE');
        $response->assertJsonCount(1, 'other_achievements');
        $response->assertJsonPath('other_achievements.0.slug', 'juara-2-debat-bahasa-inggris');
        $response->assertJsonCount(1, 'recent_articles');
        $response->assertJsonPath('recent_articles.0.slug', 'peringatan-hari-kemerdekaan-ri-di-sekolah');
    }
}
