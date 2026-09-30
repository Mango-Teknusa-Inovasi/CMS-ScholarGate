<?php

namespace App\Services\Instagram;

use Illuminate\Support\Facades\Http;

class InstagramFetcher
{
    public function __construct(
        private InstagramParser $parser
    ) {}

    /**
     * Scraper internal mandiri berbasis emulasi bot OpenGraph & SSR payload.
     *
     * @return array{shortcode: string, caption: string, author: ?string, taken_at: ?string, images: array<string>}
     */
    public function fetchNativePost(string $url, string $shortcode): array
    {
        $cleanUrl = "https://www.instagram.com/p/{$shortcode}/";

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

        $targetMedia = $this->parser->findTargetMediaInJson($html, $shortcode);
        if ($targetMedia) {
            $parsed = $this->parser->parseInstagramResponse($targetMedia, $shortcode);
            $filteredImages = $this->parser->filterPostImages($parsed['images']);

            if (! empty($parsed['caption']) || ! empty($filteredImages)) {
                $parsed['images'] = $filteredImages;
                return $parsed;
            }
        }

        $caption = '';
        if (preg_match('/<meta property="og:title" content="([^"]+)"/i', $html, $mTitle)) {
            $caption = $this->parser->cleanCaptionFromOgTitle($mTitle[1]);
        }

        if ($caption === '' && preg_match('/<meta property="og:description" content="([^"]+)"/i', $html, $mDesc)) {
            $caption = $this->parser->cleanCaptionFromOgDesc($mDesc[1]);
        }

        if ($caption === '' && preg_match('/<meta name="description" content="([^"]+)"/i', $html, $mMetaDesc)) {
            $caption = $this->parser->cleanCaptionFromOgDesc($mMetaDesc[1]);
        }

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

        $images = $this->parser->extractImagesFromHtml($html);

        return [
            'shortcode' => $shortcode,
            'caption' => trim($caption),
            'author' => $author,
            'taken_at' => null,
            'images' => $images,
        ];
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
                return $this->parser->parseInstagramResponse($json, $shortcode);
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
    public function fetchFromRapidApi(string $host, string $apiKey, string $shortcode, string $fullUrl): array
    {
        $encodedUrl = urlencode($fullUrl);
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

        return $this->parser->parseInstagramResponse($json, $shortcode);
    }

    /**
     * Fallback menggunakan oEmbed resmi publik dari Instagram.
     */
    public function fetchFromOembed(string $url, string $shortcode): array
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
}
