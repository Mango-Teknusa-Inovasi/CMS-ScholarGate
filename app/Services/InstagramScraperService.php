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
     * @return array{shortcode: string, caption: string, author: ?string, taken_at: ?string, images: array<string>}
     */
    public function fetchPost(string $url): array
    {
        $shortcode = self::extractShortcode($url);
        if (! $shortcode) {
            throw new \InvalidArgumentException('URL Instagram tidak valid. Pastikan format tautan berupa postingan atau reels Instagram (contoh: https://www.instagram.com/p/...).');
        }

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

        // Fallback: coba via oEmbed publik
        try {
            $fallback = $this->fetchFromOembed($url, $shortcode);
            if (! empty($fallback['caption']) || ! empty($fallback['images'])) {
                return $fallback;
            }
        } catch (\Throwable $e) {
            Log::info('Instagram oembed fallback failed: '.$e->getMessage());
        }

        if ($apiKey === '') {
            throw new \RuntimeException('Instagram Scraper API Key (RapidAPI) belum diatur di menu Pengaturan > Integrasi AI & Instagram.');
        }

        throw new \RuntimeException('Gagal mengambil data dari tautan Instagram ini. Pastikan akun tidak diprivate atau periksa kembali RapidAPI Key & kuota Anda.');
    }

    /**
     * Ambil data postingan menggunakan RapidAPI.
     */
    private function fetchFromRapidApi(string $host, string $apiKey, string $shortcode, string $fullUrl): array
    {
        // Prioritas endpoint umum di RapidAPI (termasuk instagram-scraper-stable-api)
        $endpoints = [
            "/post_info?shortcode={$shortcode}",
            "/get_post?code_or_id_or_url={$shortcode}",
            "/media?url=".urlencode($fullUrl),
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
