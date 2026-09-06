<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ArticleInstagramAiTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_authentication_to_generate_article(): void
    {
        $response = $this->postJson('/api/v1/admin/articles/generate-from-instagram', [
            'url' => 'https://www.instagram.com/p/DF123abc/',
        ]);

        $response->assertUnauthorized();
    }

    public function test_validates_instagram_url(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/admin/articles/generate-from-instagram', [
            'url' => 'https://facebook.com/not-instagram',
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('instagram.com', $response->json('message'));
    }

    public function test_successfully_processes_instagram_post_with_ai(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        Setting::setValue('openai_api_key', 'sk-test-mock-key');
        Setting::setValue('instagram_scraper_api_key', 'rapid-mock-key');

        // Fake image binary (1x1 PNG)
        $fakePng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

        Http::fake([
            // Mock RapidAPI endpoint
            'https://instagram-scraper-stable-api.p.rapidapi.com/*' => Http::response([
                'data' => [
                    'caption' => ['text' => 'Upacara bendera memperingati HUT RI ke-81 di SMA Negeri 1 Gedeg berjalan khidmat.'],
                    'user' => ['username' => 'sman1gedeg'],
                    'taken_at' => 1725619200,
                    'carousel_media' => [
                        [
                            'image_versions2' => [
                                'candidates' => [['url' => 'https://instagram.cdn/mock-slide1.jpg']],
                            ],
                        ],
                        [
                            'image_versions2' => [
                                'candidates' => [['url' => 'https://instagram.cdn/mock-slide2.jpg']],
                            ],
                        ],
                    ],
                ],
            ], 200),

            // Mock Image CDN downloads
            'https://instagram.cdn/*' => Http::response($fakePng, 200, ['Content-Type' => 'image/png']),

            // Mock OpenAI chat completions
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'title' => 'Peringatan HUT RI ke-81 di SMAN 1 Gedeg Berlangsung Khidmat',
                                'slug' => 'peringatan-hut-ri-ke-81-di-sman-1-gedeg-berlangsung-khidmat',
                                'excerpt' => 'Upacara bendera memperingati HUT RI di SMAN 1 Gedeg berjalan dengan penuh khidmat dan semarak.',
                                'body_html' => '<p>Upacara kemerdekaan berlangsung di lapangan utama.</p>{{IMAGE_1}}<p>Seluruh dewan guru dan siswa mengikuti kegiatan dengan disiplin.</p>',
                                'tags' => ['HUT RI', 'Upacara', 'Kesiswaan'],
                                'focus_keyword' => 'Upacara HUT RI SMAN 1 Gedeg',
                                'meta_title' => 'Peringatan HUT RI ke-81 di SMAN 1 Gedeg',
                                'meta_description' => 'Upacara bendera memperingati HUT RI di SMAN 1 Gedeg berjalan dengan penuh khidmat dan semarak.',
                            ]),
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/admin/articles/generate-from-instagram', [
            'url' => 'https://www.instagram.com/p/DF123abc/',
            'tone' => 'formal_news',
        ]);

        $response->assertOk();
        $this->assertTrue($response->json('success'));

        $data = $response->json('data');
        $this->assertSame('Peringatan HUT RI ke-81 di SMAN 1 Gedeg Berlangsung Khidmat', $data['title']);
        $this->assertNotEmpty($data['cover_path']);
        $this->assertNotEmpty($data['cover_url']);
        $this->assertStringContainsString('Upacara kemerdekaan', $data['body']);
        $this->assertSame('HUT RI, Upacara, Kesiswaan', $data['tags_text']);
        $this->assertSame(2, $data['images_count']);
    }
}
