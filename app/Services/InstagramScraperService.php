<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class InstagramScraperService
{
    /**
     * Ekstrak shortcode dari link postingan / reel / tv Instagram.
     */
    public static function extractShortcode(string $url): ?string
    {
        $url = trim($url);
        if ($url === '') {
            return null;
        }

        // Contoh:
        // https://www.instagram.com/p/DFxyz123/
        // https://instagram.com/reel/DFxyz123/?igsh=...
        // https://www.instagram.com/tv/DFxyz123/
        if (preg_match('#instagram\.com/(?:p|reel|tv)/([A-Za-z0-9_-]+)#i', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Ambil detail postingan dari Instagram (caption, foto single/carousel, author).
     *
     * Prioritas Eksekusi:
     * 1. Native Direct Scraper (Zero API Key, tanpa batasan kuota RapidAPI).
     * 2. Native Web API dengan App ID & optional Session Cookie (untuk bypass & akun private).
     * 3. RapidAPI Scraper (sebagai fallback jika dikonfigurasi).
     * 4. Meta oEmbed API (publik fallback).
     *
     * @return array{shortcode: string, caption: string, author: ?string, taken_at: ?string, images: array<string>}
     */
    public function fetchPost(string $url): array
    {
        $shortcode = self::extractShortcode($url);
        if (! $shortcode) {
            throw new \InvalidArgumentException('URL Instagram tidak valid. Pastikan format tautan berupa postingan atau reels Instagram (contoh: https://www.instagram.com/p/...).');
        }

        // TIER 1: Native Direct Scraper (Tanpa RapidAPI, Tanpa Kuota)
        try {
            $nativeData = $this->fetchNativePost($url, $shortcode);
            if (! empty($nativeData['images']) || ! empty($nativeData['caption'])) {
                return $nativeData;
            }
        } catch (\Throwable $e) {
            Log::info("Instagram native direct scraper failed for {$shortcode}: ".$e->getMessage());
        }

        // TIER 2: Native Web API dengan App ID & Optional Session Cookie
        $sessionCookie = trim((string) Setting::getValue('instagram_session_cookie', ''));
        try {
            $webApiData = $this->fetchNativeWebApi($url, $shortcode, $sessionCookie ?: null);
            if (! empty($webApiData['images']) || ! empty($webApiData['caption'])) {
                return $webApiData;
            }
        } catch (\Throwable $e) {
            Log::info("Instagram native web API failed for {$shortcode}: ".$e->getMessage());
        }

        // TIER 3: RapidAPI Fallback (Hanya jika pengguna mengisi API Key)
        $apiKey = trim((string) Setting::getValue('instagram_scraper_api_key', env('RAPIDAPI_KEY', '')));
        $host = trim((string) Setting::getValue('instagram_scraper_api_host', 'instagram-scraper-stable-api.p.rapidapi.com'));

        if ($apiKey !== '') {
            try {
                $rapidData = $this->fetchFromRapidApi($host, $apiKey, $shortcode, $url);
                if (! empty($rapidData['images']) || ! empty($rapidData['caption'])) {
                    return $rapidData;
                }
            } catch (\Throwable $e) {
                Log::warning('RapidAPI Instagram scraper error: '.$e->getMessage().', trying fallback...');
            }
        }

        // TIER 4: Meta oEmbed Publik Fallback
        try {
            $fallback = $this->fetchFromOembed($url, $shortcode);
            if (! empty($fallback['caption']) || ! empty($fallback['images'])) {
                return $fallback;
            }
        } catch (\Throwable $e) {
            Log::info('Instagram oembed fallback failed: '.$e->getMessage());
        }

        throw new \RuntimeException('Gagal mengambil data dari tautan Instagram ini secara otomatis. Akun mungkin diproteksi (private) atau dibatasi oleh Instagram. Anda dapat memasukkan teks caption secara manual di form atau mengisi Cookie Instagram di Pengaturan.');
    }

    /**
     * Scraper internal mandiri berbasis emulasi bot OpenGraph & SSR payload.
     * Tidak memerlukan API key berbayar dan tidak terkena limit kuota RapidAPI.
     *
     * @return array{shortcode: string, caption: string, author: ?string, taken_at: ?string, images: array<string>}
     */
    public function fetchNativePost(string $url, string $shortcode): array
    {
        $cleanUrl = "https://www.instagram.com/p/{$shortcode}/";

        // Rotasi User-Agent bot yang didukung SSR oleh Meta/Instagram
        $userAgents = [
            'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Twitterbot/1.0',
            'TelegramBot (like TwitterBot)',
            'WhatsApp/2.21.12.21 A',
        ];

        $html = '';
        foreach ($userAgents as $ua) {
            try {
                $response = Http::timeout(15)
                    ->withHeaders([
                        'User-Agent' => $ua,
                        'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                        'Cache-Control' => 'no-cache',
                    ])
                    ->get($cleanUrl);

                if ($response->successful() && strlen($response->body()) > 200) {
                    $html = $response->body();
                    break;
                }
            } catch (\Throwable) {
                continue;
            }
        }

        if ($html === '') {
            return [
                'shortcode' => $shortcode,
                'caption' => '',
                'author' => null,
                'taken_at' => null,
                'images' => [],
            ];
        }

        // TAHAP A: Prioritas Ekstraksi Terarah dari JSON SSR Instagram
        // Menjamin HANYA data postingan ini yang diambil (bebas dari foto profil, akun kolab, & postingan rekomendasi)
        $targetMedia = $this->findTargetMediaInJson($html, $shortcode);
        if ($targetMedia) {
            $parsed = $this->parseInstagramResponse($targetMedia, $shortcode);
            $filteredImages = $this->filterPostImages($parsed['images']);

            if (! empty($parsed['caption']) || ! empty($filteredImages)) {
                $parsed['images'] = $filteredImages;
                return $parsed;
            }
        }

        // TAHAP B: Fallback jika JSON SSR tidak tersedia
        // 1. Ekstrak Caption dari OpenGraph
        $caption = '';
        if (preg_match('/<meta property="og:title" content="([^"]+)"/i', $html, $mTitle)) {
            $caption = $this->cleanCaptionFromOgTitle($mTitle[1]);
        }

        if ($caption === '' && preg_match('/<meta property="og:description" content="([^"]+)"/i', $html, $mDesc)) {
            $caption = $this->cleanCaptionFromOgDesc($mDesc[1]);
        }

        if ($caption === '' && preg_match('/<meta name="description" content="([^"]+)"/i', $html, $mMetaDesc)) {
            $caption = $this->cleanCaptionFromOgDesc($mMetaDesc[1]);
        }

        // 2. Ekstrak Author / Username
        $author = null;
        if (preg_match('/<meta name="twitter:title" content="([^"]+)"/i', $html, $mTwitter)) {
            $decodedTwitter = html_entity_decode($mTwitter[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            if (preg_match('/\(@([A-Za-z0-9._]+)\)/', $decodedTwitter, $mUser)) {
                $author = $mUser[1];
            }
        }

        if (! $author && preg_match('/<meta property="og:url" content="https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)\//i', $html, $mUrlUser)) {
            if (! in_array(strtolower($mUrlUser[1]), ['p', 'reel', 'tv', 'explore'], true)) {
                $author = $mUrlUser[1];
            }
        }

        // 3. Ekstrak Gambar Khusus Postingan Ini (Cover & Twitter Image Saja)
        $images = $this->extractImagesFromHtml($html);

        return [
            'shortcode' => $shortcode,
            'caption' => trim($caption),
            'author' => $author,
            'taken_at' => null,
            'images' => $images,
        ];
    }

    /**
     * Cari objek data media spesifik untuk $shortcode di dalam script JSON SSR.
     * Mengisolasi data postingan agar tidak bercampur dengan rekomendasi atau feed lain.
     */
    public function findTargetMediaInJson(string $html, string $shortcode): ?array
    {
        if (! preg_match_all('/<script[^>]*>(.*?)<\/script>/is', $html, $scripts)) {
            return null;
        }

        foreach ($scripts[1] as $s) {
            if (! str_contains($s, $shortcode) || ! str_contains($s, '{')) {
                continue;
            }

            $json = json_decode($s, true);
            if (! is_array($json)) {
                continue;
            }

            $found = $this->searchMediaRecursive($json, $shortcode);
            if ($found) {
                return $found;
            }
        }

        return null;
    }

    private function searchMediaRecursive(array $obj, string $shortcode): ?array
    {
        if ((isset($obj['code']) && $obj['code'] === $shortcode) || (isset($obj['shortcode']) && $obj['shortcode'] === $shortcode)) {
            if (isset($obj['image_versions2']) || isset($obj['if_not_gated_logged_out']) || isset($obj['carousel_media']) || isset($obj['edge_sidecar_to_children']) || isset($obj['video_versions']) || isset($obj['display_url'])) {
                return $obj;
            }
        }

        foreach ($obj as $val) {
            if (is_array($val)) {
                $res = $this->searchMediaRecursive($val, $shortcode);
                if ($res) {
                    return $res;
                }
            }
        }

        return null;
    }

    /**
     * Bersihkan caption dari og:title ("User on/di Instagram: \"...\"").
     */
    public function cleanCaptionFromOgTitle(string $rawTitle): string
    {
        $decoded = html_entity_decode($rawTitle, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Pola: "... on Instagram: \"Caption...\"" atau "... di Instagram: \"Caption...\""
        if (preg_match('/(?:on|di)\s+Instagram:\s*["\']?(.*?)["\']?\s*$/isu', $decoded, $matches)) {
            $inner = trim($matches[1]);
            if ($inner !== '') {
                return $inner;
            }
        }

        return trim($decoded);
    }

    /**
     * Bersihkan caption dari og:description ("45 likes, 3 comments - user on Date: \"...\"").
     */
    public function cleanCaptionFromOgDesc(string $rawDesc): string
    {
        $decoded = html_entity_decode($rawDesc, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        if (preg_match('/:\s*["\'](.*?)["\']?\s*$/isu', $decoded, $matches)) {
            $inner = trim($matches[1]);
            if ($inner !== '') {
                return $inner;
            }
        }

        return trim($decoded);
    }

    /**
     * Ekstrak gambar utama postingan dari OpenGraph / Twitter tags.
     * Tidak mencari regex bebas ke seluruh HTML untuk menghindari foto profil & rekomendasi postingan lain.
     *
     * @return array<string>
     */
    public function extractImagesFromHtml(string $html): array
    {
        $images = [];

        // Cover utama dari og:image dan twitter:image spesifik postingan ini
        if (preg_match_all('/<meta property="og:image" content="([^"]+)"/i', $html, $mOgImg)) {
            foreach ($mOgImg[1] as $raw) {
                $images[] = html_entity_decode($raw, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
        }

        if (preg_match('/<meta name="twitter:image" content="([^"]+)"/i', $html, $mTwImg)) {
            $images[] = html_entity_decode($mTwImg[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        return $this->filterPostImages($images);
    }

    /**
     * Filter ketat untuk membersihkan daftar gambar:
     * - Mengeliminasi foto profil (-19/, profile_pic, avatar, s150x150, dll)
     * - Mengeliminasi aset statis / icon Meta
     * - Menghilangkan duplikasi
     *
     * @param  array<string>  $images
     * @return array<string>
     */
    public function filterPostImages(array $images): array
    {
        $filtered = [];
        $seenBasenames = [];

        foreach ($images as $url) {
            $trimmed = trim((string) $url);
            if (! filter_var($trimmed, FILTER_VALIDATE_URL)) {
                continue;
            }

            // Exclude profile pictures (-19/ adalah identifier internal CDN Instagram untuk avatar)
            if (preg_match('#(/t51\.[0-9]+-19/|/s150x150/|/s320x320/|/s100x100/|150_n\.|profile_pic|rsrc\.php|static\.cdninstagram|avatar)#i', $trimmed)) {
                continue;
            }

            $base = basename((string) parse_url($trimmed, PHP_URL_PATH));
            if ($base !== '' && ! isset($seenBasenames[$base])) {
                $seenBasenames[$base] = true;
                $filtered[] = $trimmed;
            }
        }

        return $filtered;
    }

    /**
     * Native Web API Instagram menggunakan App ID dan opsional session cookie.
     *
     * @return array{shortcode: string, caption: string, author: ?string, taken_at: ?string, images: array<string>}
     */
    public function fetchNativeWebApi(string $url, string $shortcode, ?string $sessionCookie = null): array
    {
        $headers = [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'X-IG-App-ID' => '936619743392459',
            'Accept' => '*/*',
            'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8',
            'Sec-Fetch-Mode' => 'cors',
        ];

        if ($sessionCookie) {
            // Normalisasi cookie jika user hanya memasukkan sessionid tanpa nama key
            if (! str_contains($sessionCookie, '=')) {
                $sessionCookie = "sessionid={$sessionCookie}";
            }
            $headers['Cookie'] = $sessionCookie;
        }

        $res = Http::timeout(15)
            ->withHeaders($headers)
            ->get("https://www.instagram.com/p/{$shortcode}/?__a=1&__d=dis");

        if ($res->successful()) {
            $json = $res->json();
            if (is_array($json) && ! empty($json)) {
                return $this->parseInstagramResponse($json, $shortcode);
            }
        }

        return [
            'shortcode' => $shortcode,
            'caption' => '',
            'author' => null,
            'taken_at' => null,
            'images' => [],
        ];
    }

    /**
     * Ambil data postingan menggunakan RapidAPI.
     */
    private function fetchFromRapidApi(string $host, string $apiKey, string $shortcode, string $fullUrl): array
    {
        $encodedUrl = urlencode($fullUrl);
        // Prioritas endpoint RapidAPI (spesifik untuk instagram-scraper-stable-api dan scraper umum)
        $endpoints = [
            "/get_media_data.php?reel_post_code_or_url={$encodedUrl}&type=post",
            "/get_media_data.php?reel_post_code_or_url={$shortcode}&type=post",
            "/get_media_data.php?reel_post_code_or_url={$encodedUrl}&type=reel",
            "/get_reel_title.php?reel_post_code_or_url={$encodedUrl}&type=post",
            "/post_info?shortcode={$shortcode}",
            "/get_post?code_or_id_or_url={$shortcode}",
            "/media?url={$encodedUrl}",
            "/media_info?shortcode={$shortcode}",
        ];

        $client = Http::withHeaders([
            'x-rapidapi-host' => $host,
            'x-rapidapi-key' => $apiKey,
        ])->timeout(20);

        $response = null;
        $baseUrl = 'https://'.rtrim($host, '/');

        foreach ($endpoints as $ep) {
            try {
                $res = $client->get($baseUrl.$ep);
                if ($res->successful() && ! empty($res->json())) {
                    $response = $res;
                    break;
                }
            } catch (\Throwable) {
                continue;
            }
        }

        if (! $response || ! $response->successful()) {
            throw new \RuntimeException('Respon RapidAPI gagal atau status error: '.($response ? $response->status() : 'No response'));
        }

        $json = $response->json();

        return $this->parseInstagramResponse($json, $shortcode);
    }

    /**
     * Fallback menggunakan oEmbed resmi publik dari Instagram.
     */
    private function fetchFromOembed(string $url, string $shortcode): array
    {
        $oembedUrl = 'https://api.instagram.com/oembed/?url='.urlencode($url);
        $res = Http::timeout(10)->get($oembedUrl);

        if ($res->successful()) {
            $data = $res->json();
            $caption = (string) ($data['title'] ?? '');
            $author = (string) ($data['author_name'] ?? '');
            $images = [];

            if (! empty($data['thumbnail_url'])) {
                $images[] = (string) $data['thumbnail_url'];
            }

            return [
                'shortcode' => $shortcode,
                'caption' => $caption,
                'author' => $author ?: null,
                'taken_at' => null,
                'images' => $images,
            ];
        }

        return [
            'shortcode' => $shortcode,
            'caption' => '',
            'author' => null,
            'taken_at' => null,
            'images' => [],
        ];
    }

    /**
     * Parsing struktur JSON beragam dari penyedia scraper Instagram.
     */
    public function parseInstagramResponse(array $data, string $shortcode): array
    {
        // Tangani wrapper umum seperti {"data": {...}} atau {"items": [{...}]}
        $payload = $data['data'] ?? $data['items'][0] ?? $data['graphql']['shortcode_media'] ?? $data;

        // 1. Ekstrak Caption
        $caption = '';
        if (isset($payload['caption'])) {
            $caption = is_array($payload['caption'])
                ? ($payload['caption']['text'] ?? '')
                : (string) $payload['caption'];
        } elseif (! empty($payload['edge_media_to_caption']['edges'][0]['node']['text'])) {
            $caption = (string) $payload['edge_media_to_caption']['edges'][0]['node']['text'];
        } elseif (! empty($payload['title'])) {
            $caption = (string) $payload['title'];
        } elseif (! empty($payload['description'])) {
            $caption = (string) $payload['description'];
        }

        // 2. Ekstrak Author
        $author = null;
        if (! empty($payload['user']['username'])) {
            $author = (string) $payload['user']['username'];
        } elseif (! empty($payload['owner']['username'])) {
            $author = (string) $payload['owner']['username'];
        } elseif (! empty($payload['author_name'])) {
            $author = (string) $payload['author_name'];
        }

        // 3. Ekstrak Tanggal
        $takenAt = null;
        $timestamp = $payload['taken_at'] ?? $payload['taken_at_timestamp'] ?? $payload['created_time'] ?? null;
        if ($timestamp && is_numeric($timestamp)) {
            $takenAt = date('Y-m-d H:i:s', (int) $timestamp);
        }

        // 4. Ekstrak Semua Gambar (Single Post maupun Carousel / Multi-slide)
        $images = [];

        // Kasus A: Carousel / Multi-image (carousel_media)
        if (! empty($payload['carousel_media']) && is_array($payload['carousel_media'])) {
            foreach ($payload['carousel_media'] as $item) {
                $img = $this->extractBestImageFromItem($item);
                if ($img) {
                    $images[] = $img;
                }
            }
        }
        // Kasus B: Carousel dari graphql (edge_sidecar_to_children)
        elseif (! empty($payload['edge_sidecar_to_children']['edges']) && is_array($payload['edge_sidecar_to_children']['edges'])) {
            foreach ($payload['edge_sidecar_to_children']['edges'] as $edge) {
                $node = $edge['node'] ?? [];
                $img = $this->extractBestImageFromItem($node);
                if ($img) {
                    $images[] = $img;
                }
            }
        }
        // Kasus C: Carousel array direct "images"
        elseif (! empty($payload['images']) && is_array($payload['images'])) {
            foreach ($payload['images'] as $imgItem) {
                if (is_string($imgItem)) {
                    $images[] = $imgItem;
                } elseif (is_array($imgItem)) {
                    $best = $this->extractBestImageFromItem($imgItem);
                    if ($best) {
                        $images[] = $best;
                    }
                }
            }
        }

        // Kasus D: Jika bukan carousel atau belum dapat, ambil single image utama
        if (empty($images)) {
            $singleImg = $this->extractBestImageFromItem($payload);
            if ($singleImg) {
                $images[] = $singleImg;
            }
        }

        // Hapus duplikasi dan filter url yang valid
        $filteredImages = [];
        foreach ($images as $imgUrl) {
            $trimmed = trim((string) $imgUrl);
            if (filter_var($trimmed, FILTER_VALIDATE_URL) && ! in_array($trimmed, $filteredImages, true)) {
                $filteredImages[] = $trimmed;
            }
        }

        return [
            'shortcode' => $shortcode,
            'caption' => trim($caption),
            'author' => $author,
            'taken_at' => $takenAt,
            'images' => $filteredImages,
        ];
    }

    /**
     * Ambil URL gambar resolusi terbaik dari sebuah node media item.
     */
    private function extractBestImageFromItem(array $item): ?string
    {
        // 1. image_versions2 (format standar API Instagram)
        if (! empty($item['image_versions2']['candidates']) && is_array($item['image_versions2']['candidates'])) {
            // Kandidat pertama biasanya adalah resolusi tertinggi
            return (string) ($item['image_versions2']['candidates'][0]['url'] ?? null);
        }

        // 2. display_url (format GraphQL Instagram)
        if (! empty($item['display_url'])) {
            return (string) $item['display_url'];
        }

        // 3. display_resources
        if (! empty($item['display_resources']) && is_array($item['display_resources'])) {
            $last = end($item['display_resources']);
            if (! empty($last['src'])) {
                return (string) $last['src'];
            }
        }

        // 4. thumbnail_url / image_url / url
        if (! empty($item['thumbnail_url'])) {
            return (string) $item['thumbnail_url'];
        }
        if (! empty($item['image_url'])) {
            return (string) $item['image_url'];
        }
        if (! empty($item['url']) && is_string($item['url'])) {
            return (string) $item['url'];
        }

        return null;
    }
}
