<?php

namespace App\Services;

use App\Models\Setting;
use App\Services\Instagram\InstagramFetcher;
use App\Services\Instagram\InstagramParser;
use Illuminate\Support\Facades\Log;

class InstagramScraperService
{
    private InstagramParser $parser;
    private InstagramFetcher $fetcher;

    public function __construct(
        ?InstagramParser $parser = null,
        ?InstagramFetcher $fetcher = null
    ) {
        $this->parser = $parser ?? app(InstagramParser::class);
        $this->fetcher = $fetcher ?? app(InstagramFetcher::class, ['parser' => $this->parser]);
    }

    /**
     * Ekstrak shortcode dari link postingan / reel / tv Instagram.
     */
    public static function extractShortcode(string $url): ?string
    {
        return InstagramParser::extractShortcode($url);
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

        // TIER 1: Native Direct Scraper
        try {
            $nativeData = $this->fetcher->fetchNativePost($url, $shortcode);
            if (! empty($nativeData['images']) || ! empty($nativeData['caption'])) {
                return $nativeData;
            }
        } catch (\Throwable $e) {
            Log::info("Instagram native direct scraper failed for {$shortcode}: ".$e->getMessage());
        }

        // TIER 2: Native Web API
        $sessionCookie = trim((string) Setting::getValue('instagram_session_cookie', ''));
        try {
            $webApiData = $this->fetcher->fetchNativeWebApi($url, $shortcode, $sessionCookie ?: null);
            if (! empty($webApiData['images']) || ! empty($webApiData['caption'])) {
                return $webApiData;
            }
        } catch (\Throwable $e) {
            Log::info("Instagram native web API failed for {$shortcode}: ".$e->getMessage());
        }

        // TIER 3: RapidAPI Fallback
        $apiKey = trim((string) Setting::getValue('instagram_scraper_api_key', env('RAPIDAPI_KEY', '')));
        $host = trim((string) Setting::getValue('instagram_scraper_api_host', 'instagram-scraper-stable-api.p.rapidapi.com'));

        if ($apiKey !== '') {
            try {
                $rapidData = $this->fetcher->fetchFromRapidApi($host, $apiKey, $shortcode, $url);
                if (! empty($rapidData['images']) || ! empty($rapidData['caption'])) {
                    return $rapidData;
                }
            } catch (\Throwable $e) {
                Log::warning('RapidAPI Instagram scraper error: '.$e->getMessage().', trying fallback...');
            }
        }

        // TIER 4: Meta oEmbed Publik Fallback
        try {
            $fallback = $this->fetcher->fetchFromOembed($url, $shortcode);
            if (! empty($fallback['caption']) || ! empty($fallback['images'])) {
                return $fallback;
            }
        } catch (\Throwable $e) {
            Log::info('Instagram oembed fallback failed: '.$e->getMessage());
        }

        throw new \RuntimeException('Gagal mengambil data dari tautan Instagram ini secara otomatis. Akun mungkin diproteksi (private) atau dibatasi oleh Instagram. Anda dapat memasukkan teks caption secara manual di form atau mengisi Cookie Instagram di Pengaturan.');
    }

    public function fetchNativePost(string $url, string $shortcode): array
    {
        return $this->fetcher->fetchNativePost($url, $shortcode);
    }

    public function fetchNativeWebApi(string $url, string $shortcode, ?string $sessionCookie = null): array
    {
        return $this->fetcher->fetchNativeWebApi($url, $shortcode, $sessionCookie);
    }

    public function parseInstagramResponse(array $data, string $shortcode): array
    {
        return $this->parser->parseInstagramResponse($data, $shortcode);
    }

    public function cleanCaptionFromOgTitle(string $rawTitle): string
    {
        return $this->parser->cleanCaptionFromOgTitle($rawTitle);
    }

    public function cleanCaptionFromOgDesc(string $rawDesc): string
    {
        return $this->parser->cleanCaptionFromOgDesc($rawDesc);
    }

    public function extractImagesFromHtml(string $html): array
    {
        return $this->parser->extractImagesFromHtml($html);
    }

    public function filterPostImages(array $images): array
    {
        return $this->parser->filterPostImages($images);
    }
}
