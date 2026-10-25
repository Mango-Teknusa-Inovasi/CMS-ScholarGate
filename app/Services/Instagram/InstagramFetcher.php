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
                $response = Http::connectTimeout(5)->timeout(15)
                    ->withOptions(['allow_redirects' => false])
                    ->withHeaders([
                        'User-Agent' => $ua,
                        'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                        'Cache-Control' => 'no-cache',
                    ])
                    ->get($cleanUrl);

                if ($response->successful() && strlen($response->body()) > 200 && strlen($response->body()) <= 8 * 1024 * 1024) {
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
        $ogTitle = $this->parser->metaContent($html, 'og:title');
        if ($ogTitle !== null) {
            $caption = $this->parser->cleanCaptionFromOgTitle($ogTitle);
        }
        $ogDescription = $this->parser->metaContent($html, 'og:description');
        if ($caption === '' && $ogDescription !== null) {
            $caption = $this->parser->cleanCaptionFromOgDesc($ogDescription);
        }
        $description = $this->parser->metaContent($html, 'description');
        if ($caption === '' && $description !== null) {
            $caption = $this->parser->cleanCaptionFromOgDesc($description);
        }

        $author = null;
        $twitterTitle = $this->parser->metaContent($html, 'twitter:title');
        if ($twitterTitle !== null) {
            $decodedTwitter = $twitterTitle;
            if (preg_match('/\(@([A-Za-z0-9._]+)\)/', $decodedTwitter, $mUser)) {
                $author = $mUser[1];
            }
        }

        $openGraphUrl = $this->parser->metaContent($html, 'og:url');
        if (! $author && $openGraphUrl !== null) {
            $parts = parse_url($openGraphUrl);
            $segments = explode('/', trim((string) ($parts['path'] ?? ''), '/'));
            if (InstagramParser::isInstagramHost((string) ($parts['host'] ?? ''))
                && isset($segments[0])
                && ! in_array(strtolower($segments[0]), ['p', 'reel', 'tv', 'explore'], true)) {
                $author = $segments[0];
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

        $res = Http::connectTimeout(5)->timeout(15)
            ->withOptions(['allow_redirects' => false])
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

        if (! filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) || str_contains($host, '/')) {
            throw new \InvalidArgumentException('Host RapidAPI tidak valid.');
        }

        $client = Http::connectTimeout(5)->withOptions(['allow_redirects' => false])->withHeaders([
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
        $res = Http::connectTimeout(5)->timeout(10)->withOptions(['allow_redirects' => false])->get($oembedUrl);

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
