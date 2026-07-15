<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Services\SeoService;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class SeoController extends Controller
{
    public function __construct(private SeoService $seo) {}

    public function robots(): Response
    {
        $s = $this->seo->siteSettings();
        $body = implode("\n", array_filter([
            '# Scholargate — SEO / AEO crawl rules',
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            'Disallow: /admin/',
            'Disallow: /api/',
            'Disallow: /install',
            'Disallow: /update',
            'Disallow: /login',
            'Disallow: /daftar',
            'Disallow: /register',
            'Disallow: /akun',
            'Disallow: /preview/',
            '',
            # AI / answer engines — AEO & GEO
            'User-agent: GPTBot',
            'Allow: /',
            '',
            'User-agent: ChatGPT-User',
            'Allow: /',
            '',
            'User-agent: Google-Extended',
            'Allow: /',
            '',
            'User-agent: Googlebot',
            'Allow: /',
            '',
            'User-agent: anthropic-ai',
            'Allow: /',
            '',
            'User-agent: ClaudeBot',
            'Allow: /',
            '',
            'User-agent: PerplexityBot',
            'Allow: /',
            '',
            'User-agent: Bytespider',
            'Allow: /',
            '',
            'Sitemap: '.$s['app_url'].'/sitemap.xml',
            'LLMs-Txt: '.$s['app_url'].'/llms.txt',
            trim((string) ($s['robots_extra'] ?? '')) ?: null,
            '',
        ], fn ($line) => $line !== null));

        return response($body, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    public function sitemap(): Response
    {
        $urls = $this->seo->sitemapUrls();
        $xml = ['<?xml version="1.0" encoding="UTF-8"?>'];
        $xml[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach ($urls as $u) {
            $xml[] = '<url>';
            $xml[] = '<loc>'.e($u['loc']).'</loc>';
            if (! empty($u['lastmod'])) {
                $xml[] = '<lastmod>'.e($u['lastmod']).'</lastmod>';
            }
            if (! empty($u['changefreq'])) {
                $xml[] = '<changefreq>'.e($u['changefreq']).'</changefreq>';
            }
            if (! empty($u['priority'])) {
                $xml[] = '<priority>'.e($u['priority']).'</priority>';
            }
            $xml[] = '</url>';
        }
        $xml[] = '</urlset>';

        return response(implode('', $xml), 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=1800',
        ]);
    }

    public function llms(): Response
    {
        return response($this->seo->llmsTxt(), 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'public, max-age=1800',
        ]);
    }

    public function metaHome(): \Illuminate\Http\JsonResponse
    {
        return response()->json($this->seo->pageMeta('/'));
    }

    public function metaPage(string $page): \Illuminate\Http\JsonResponse
    {
        $map = [
            'profil' => '/profil',
            'artikel' => '/artikel',
            'prestasi' => '/prestasi',
            'ekstrakurikuler' => '/ekstrakurikuler',
            'download' => '/download',
        ];
        $path = $map[$page] ?? '/';

        return response()->json($this->seo->pageMeta($path));
    }

    public function metaArticle(string $slug): \Illuminate\Http\JsonResponse
    {
        $article = Article::published()
            ->with(['category:id,name', 'tags:id,name', 'author:id,name'])
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json($this->seo->articleMeta($article));
    }
}
