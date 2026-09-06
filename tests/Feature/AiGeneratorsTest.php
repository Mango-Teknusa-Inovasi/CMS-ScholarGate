<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AiGeneratorsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Setting::setValue('openai_api_key', 'sk-mock-key-for-testing');
        Setting::setValue('openai_model', 'gpt-4o-mini');
        Setting::setValue('custom_ai_model_name', 'ScholarGate Intelligence');
    }

    public function test_endpoints_require_authentication(): void
    {
        $this->postJson('/api/v1/admin/ai/generate-article-prompt', ['topic' => 'Juara Robotik'])
            ->assertUnauthorized();

        $this->postJson('/api/v1/admin/ai/generate-welcome', ['theme' => 'Tahun Ajaran Baru'])
            ->assertUnauthorized();

        $this->postJson('/api/v1/admin/ai/generate-profile', ['tab_label' => 'Sejarah'])
            ->assertUnauthorized();

        $this->postJson('/api/v1/admin/ai/generate-achievement', ['competition' => 'OSN', 'participant' => 'Rizky'])
            ->assertUnauthorized();

        $this->postJson('/api/v1/admin/ai/assist-text', ['text' => 'halo', 'action' => 'polish_puebi'])
            ->assertUnauthorized();
    }

    public function test_generate_article_from_prompt(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'title' => 'Siswa SMAN 1 Raih Prestasi di Olimpiade Sains',
                                'slug' => 'siswa-sman-1-raih-prestasi-di-olimpiade-sains',
                                'excerpt' => 'Prestasi gemilang diraih siswa di ajang bergengsi.',
                                'body_html' => '<p>Siswa SMA Negeri 1 berhasil menorehkan prestasi gemilang.</p>',
                                'category' => 'Prestasi',
                                'tags' => ['prestasi', 'olimpiade', 'sains'],
                                'focus_keyword' => 'prestasi sains',
                                'meta_title' => 'Prestasi Sains Siswa',
                                'meta_description' => 'Berita prestasi siswa.',
                            ]),
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/admin/ai/generate-article-prompt', [
            'topic' => 'Siswa menjuarai lomba robotik nasional di Surabaya',
            'key_points' => 'Membawa pulang piala bergilir dan beasiswa',
            'tone' => 'achievement',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Siswa SMAN 1 Raih Prestasi di Olimpiade Sains')
            ->assertJsonPath('data.category', 'Prestasi');
    }

    public function test_generate_welcome_speech(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'title' => 'Sambutan Hangat Kepala Sekolah',
                                'badge_left' => 'Tahun Ajaran 2026/2027',
                                'badge_right' => 'Unggul & Berkarakter',
                                'chat_label' => 'Pesan Inspiratif',
                                'body_html' => '<p>Assalamu\'alaikum warahmatullahi wabarakatuh, selamat datang di sekolah kami tercinta.</p>',
                            ]),
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/admin/ai/generate-welcome', [
            'speaker' => 'Dr. H. Ahmad Dahlan, M.Pd.',
            'theme' => 'Menyambut Generasi Emas dan Kurikulum Digital',
            'tone' => 'warm_inspirational',
            'target' => 'home',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Sambutan Hangat Kepala Sekolah')
            ->assertJsonPath('data.chat_label', 'Pesan Inspiratif');
    }

    public function test_generate_profile_section(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'tab_label' => 'Visi & Misi',
                                'content_html' => '<h3>Visi Sekolah</h3><p>Mencetak insan bertakwa, berprestasi, dan berwawasan global.</p>',
                            ]),
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/admin/ai/generate-profile', [
            'tab_label' => 'Visi Misi',
            'hints' => 'Berakhlak mulia, cerdas digital, berdaya saing internasional',
            'style' => 'vision_mission',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.tab_label', 'Visi & Misi');
        $this->assertStringContainsString('Visi Sekolah', (string) $response->json('data.content_html'));
    }

    public function test_generate_achievement_article(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'title' => 'Raih Medali Emas, Siswa Harumkan Sekolah di Kancah Nasional',
                                'slug' => 'raih-medali-emas-siswa-harumkan-sekolah-di-kancah-nasional',
                                'badge_label' => 'Juara 1 Nasional 🏆',
                                'excerpt' => 'Kemenangan membanggakan diraih dalam ajang bergengsi.',
                                'body_html' => '<p>Kebanggaan besar menyelimuti seluruh civitas akademika setelah siswa kami menjuarai lomba.</p>',
                            ]),
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/admin/ai/generate-achievement', [
            'competition' => 'Olimpiade Sains Nasional 2026',
            'level' => 'Nasional',
            'participant' => 'Ananda Rizky Pratama',
            'rank' => 'Juara 1 Medali Emas',
            'organizer' => 'Puspresnas Kemendikbud',
            'notes' => 'Menyingkirkan ribuan peserta dari seluruh tanah air.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.badge_label', 'Juara 1 Nasional 🏆')
            ->assertJsonPath('data.slug', 'raih-medali-emas-siswa-harumkan-sekolah-di-kancah-nasional');
    }

    public function test_universal_ai_assistant_copilot_assist_text(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => '<p>Siswa-siswi SMA Negeri 1 Gedeg senantiasa menjunjung tinggi nilai integritas.</p>',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/admin/ai/assist-text', [
            'text' => 'siswa sman 1 gedeg selalu junjung integritas',
            'action' => 'polish',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);
        $this->assertStringContainsString('Siswa-siswi SMA Negeri 1 Gedeg', (string) $response->json('data.result_html'));
    }
}
