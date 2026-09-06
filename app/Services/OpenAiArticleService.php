<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OpenAiArticleService
{
    /**
     * Generate artikel berita sekolah dari caption Instagram menggunakan OpenAI API.
     *
     * @param  array{caption: string, image_count: int, tone?: string, author?: ?string, date?: ?string}  $context
     * @return array{
     *     title: string,
     *     slug: string,
     *     excerpt: string,
     *     body_html: string,
     *     tags: array<string>,
     *     focus_keyword: string,
     *     meta_title: string,
     *     meta_description: string
     * }
     */
    public function generateArticle(array $context): array
    {
        $apiKey = trim((string) Setting::getValue('openai_api_key', env('OPENAI_API_KEY', '')));
        if ($apiKey === '') {
            throw new \RuntimeException('OpenAI API Key belum dikonfigurasi. Silakan masukkan API Key di menu Pengaturan > Integrasi AI & Instagram.');
        }

        $model = trim((string) Setting::getValue('openai_model', 'gpt-4o-mini'));
        if ($model === '') {
            $model = 'gpt-4o-mini';
        }

        $customSystemPrompt = trim((string) Setting::getValue('openai_custom_prompt', ''));

        $caption = trim((string) ($context['caption'] ?? ''));
        $imageCount = (int) ($context['image_count'] ?? 1);
        $tone = (string) ($context['tone'] ?? 'formal_news');
        $author = (string) ($context['author'] ?? '');
        $date = (string) ($context['date'] ?? '');

        $toneDescription = match ($tone) {
            'achievement' => 'Fokuskan pada berita prestasi/penghargaan, apresiasi tinggi terhadap siswa/guru berprestasi, kebanggaan sekolah, dan inspirasi bagi siswa lain.',
            'casual' => 'Gaya bahasa liputan kegiatan ekstrakurikuler/organisasi yang hangat, santai namun tetap sopan, edukatif, dan ramah generasi muda.',
            default => 'Gaya jurnalisme berita sekolah formal, objektif, edukatif, menggunakan Bahasa Indonesia baku (PUEBI/KBBI) yang mengalir enak dibaca.',
        };

        $baseSystemPrompt = <<<PROMPT
Anda adalah redaktur dan jurnalis senior untuk website resmi institusi sekolah (CMS ScholarGate).
Tugas Anda adalah mengubah materi/caption dari postingan Instagram sekolah menjadi artikel berita web resmi yang utuh, profesional, berbobot, dan ramah SEO (AEO & Google News).

Petunjuk penulisan:
1. Pisahkan fakta penting 5W+1H dari caption Instagram (singkirkan hashtag berlebih seperti #fyp #viral dan emoji berlebih).
2. Tulis judul berita yang berwibawa, informatif, dan tidak clickbait (maksimal 75 karakter, tanpa emoji).
3. Buat lead artikel/excerpt (ringkasan 1-2 kalimat) yang menarik pembaca.
4. Tulis isi artikel (body_html) dalam format HTML bersih (gunakan tag <p>, <h2> untuk subjudul bahasan).
   - Panjang artikel idealnya 3 hingga 5 paragraf berbobot.
   - {$toneDescription}
5. Penataan Gambar:
   - Ada total {$imageCount} gambar. Gambar ke-1 dijadikan cover utama artikel.
   - Jika total gambar lebih dari 1, Anda dapat menyisipkan placeholder penempatan gambar seperti {{IMAGE_1}}, {{IMAGE_2}} di sela-sela antar paragraf yang menurut Anda paling pas untuk menampilkan foto dokumentasi kegiatan tersebut.
6. Buat rekomendasi Tag relevan (3-5 tag), Focus Keyword SEO, Meta Title, dan Meta Description (140-160 karakter).
PROMPT;

        if ($customSystemPrompt !== '') {
            $systemPrompt = $baseSystemPrompt."\n\nInstruksi Khusus Tambahan dari Sekolah:\n".$customSystemPrompt;
        } else {
            $systemPrompt = $baseSystemPrompt;
        }

        $userPrompt = "Berikut materi dari postingan Instagram:\n";
        if ($author) {
            $userPrompt .= "- Akun Pengunggah: @{$author}\n";
        }
        if ($date) {
            $userPrompt .= "- Tanggal Kegiatan: {$date}\n";
        }
        $userPrompt .= "- Jumlah Gambar: {$imageCount}\n";
        $userPrompt .= "- Caption Mentah:\n\"\"\"\n{$caption}\n\"\"\"\n\n";
        $userPrompt .= "Buat artikel berita sekarang dalam format JSON sesuai skema berikut:\n";
        $userPrompt .= <<<'SCHEMA'
{
  "title": "string (Judul berita formal)",
  "slug": "string (kebab-case URL slug)",
  "excerpt": "string (ringkasan 1-2 kalimat)",
  "body_html": "string (HTML bersih dengan <p>, <h2>, dan {{IMAGE_X}} placeholder)",
  "tags": ["string", "string"],
  "focus_keyword": "string (2-4 kata kunci utama)",
  "meta_title": "string (Judul SEO)",
  "meta_description": "string (Deskripsi SEO 140-160 karakter)"
}
SCHEMA;

        $endpoint = self::resolveChatEndpoint();

        $payload = [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.7,
        ];

        if (! str_contains($model, 'reasoner')) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $response = Http::withToken($apiKey)
            ->withHeaders([
                'HTTP-Referer' => config('app.url', 'https://sman1gedeg.sch.id'),
                'X-Title' => 'ScholarGate CMS',
            ])
            ->timeout(60)
            ->post($endpoint, $payload);

        if (! $response->successful()) {
            $err = $response->json('error.message') ?? $response->body();
            Log::error('OpenAI generation error: '.$err);
            throw new \RuntimeException('Gagal memproses artikel dengan AI ('.$endpoint.'): '.$err);
        }

        $rawContent = $response->json('choices.0.message.content');
        if (! $rawContent) {
            throw new \RuntimeException('Respon kosong dari penyedia AI.');
        }

        $parsed = json_decode($rawContent, true);
        if (! is_array($parsed)) {
            // Coba bersihkan markdown json wrapper jika ada
            $cleaned = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($rawContent));
            $parsed = json_decode($cleaned, true);
        }

        if (! is_array($parsed)) {
            throw new \RuntimeException('Gagal mengurai format JSON respon dari penyedia AI.');
        }

        $title = trim((string) ($parsed['title'] ?? ''));
        if ($title === '') {
            $title = 'Liputan Kegiatan: '.Str::limit($caption, 50);
        }

        $slug = trim((string) ($parsed['slug'] ?? ''));
        if ($slug === '') {
            $slug = Str::slug($title);
        } else {
            $slug = Str::slug($slug);
        }

        $excerpt = trim((string) ($parsed['excerpt'] ?? ''));
        if ($excerpt === '') {
            $excerpt = Str::limit(strip_tags((string) ($parsed['body_html'] ?? $caption)), 160);
        }

        $bodyHtml = trim((string) ($parsed['body_html'] ?? ''));
        if ($bodyHtml === '') {
            $bodyHtml = '<p>'.nl2br(e($caption)).'</p>';
        }

        $tags = is_array($parsed['tags'] ?? null)
            ? array_values(array_filter(array_map('trim', $parsed['tags'])))
            : ['Kegiatan', 'Informasi'];

        $focusKeyword = trim((string) ($parsed['focus_keyword'] ?? ''));
        $metaTitle = trim((string) ($parsed['meta_title'] ?? $title));
        $metaDesc = trim((string) ($parsed['meta_description'] ?? $excerpt));

        return [
            'title' => $title,
            'slug' => $slug,
            'excerpt' => $excerpt,
            'body_html' => $bodyHtml,
            'tags' => $tags,
            'focus_keyword' => $focusKeyword,
            'meta_title' => $metaTitle,
            'meta_description' => $metaDesc,
        ];
    }

    /**
     * Tentukan URL lengkap endpoint chat completions dari Base URL.
     */
    public static function resolveChatEndpoint(?string $customBase = null): string
    {
        $base = trim($customBase ?: (string) Setting::getValue('openai_base_url', env('OPENAI_BASE_URL', 'https://api.openai.com/v1')));
        if ($base === '') {
            $base = 'https://api.openai.com/v1';
        }

        $base = rtrim($base, '/');

        if (str_ends_with($base, '/chat/completions')) {
            return $base;
        }

        return $base.'/chat/completions';
    }

    /**
     * Uji koneksi API AI (OpenAI / OpenRouter / DeepSeek / provider kompatibel).
     */
    public function testConnection(?string $apiKey = null, ?string $model = null, ?string $baseUrl = null): array
    {
        $key = trim($apiKey ?: (string) Setting::getValue('openai_api_key', env('OPENAI_API_KEY', '')));
        if ($key === '') {
            return ['ok' => false, 'message' => 'API Key belum diisi.'];
        }

        $selectedModel = trim($model ?: (string) Setting::getValue('openai_model', 'gpt-4o-mini')) ?: 'gpt-4o-mini';
        $endpoint = self::resolveChatEndpoint($baseUrl);

        try {
            $response = Http::withToken($key)
                ->withHeaders([
                    'HTTP-Referer' => config('app.url', 'https://sman1gedeg.sch.id'),
                    'X-Title' => 'ScholarGate CMS',
                ])
                ->timeout(15)
                ->post($endpoint, [
                    'model' => $selectedModel,
                    'messages' => [
                        ['role' => 'user', 'content' => 'Halo, balas dengan kata "OK" jika terhubung.'],
                    ],
                    'max_tokens' => 10,
                ]);

            if ($response->successful()) {
                return ['ok' => true, 'message' => 'Koneksi AI berhasil! (Endpoint: '.$endpoint.', Model: '.$selectedModel.')'];
            }

            $errMsg = $response->json('error.message') ?: 'HTTP '.$response->status().' - '.$response->body();

            return ['ok' => false, 'message' => 'Gagal terhubung: '.$errMsg];
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'Koneksi error: '.$e->getMessage()];
        }
    }
}
