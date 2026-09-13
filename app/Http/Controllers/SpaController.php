<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Services\SeoService;
use App\Support\Installer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\File;

/**
 * @deprecated Legacy SPA shell. UI is now Inertia (`PageController` + public/build).
 * Kept temporarily so old bookmarks / mid-migration deploys can still serve public/spa if present.
 */
class SpaController extends Controller
{
    public function __construct(private SeoService $seo) {}

    /**
     * Serve React SPA + inject meta server-side for bots/crawlers (OG/title).
     *
     * @deprecated Use Inertia routes in routes/web.php
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        // Hanya redirect ke installer jika benar-benar diizinkan (bukan sekadar lock hilang)
        if (! Installer::isInstalled() && Installer::canInstallViaWeb()) {
            return redirect()->route('install.show');
        }

        $index = public_path('spa/index.html');

        if (! File::exists($index)) {
            return response()->view('spa-missing', [], 503);
        }

        $html = File::get($index);
        $meta = $this->metaForPath('/'.ltrim($request->path(), '/'));

        $html = $this->injectMeta($html, $meta);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-cache, private',
        ]);
    }

    /**
     * @return array{title: string, description: string, canonical: string, og_type: string, og_image: ?string, robots: string, json_ld: ?array}
     */
    private function metaForPath(string $path): array
    {
        $path = $path === '' ? '/' : $path;

        // Preview draf — noindex (tetap bawa GSC verification agar domain verify)
        if (str_starts_with($path, '/preview/')) {
            $base = $this->seo->pageMeta('/');

            return array_merge($base, [
                'title' => 'Pratinjau draf | ' . ($base['site_name'] ?? config('app.name', 'Portal Resmi')),
                'description' => 'Pratinjau konten tidak dipublikasikan.',
                'canonical' => $this->seo->absoluteUrl($path),
                'og_type' => 'article',
                'robots' => 'noindex,nofollow',
                'json_ld' => null,
            ]);
        }

        // Admin & auth pages — noindex
        if (str_starts_with($path, '/admin') || in_array($path, ['/login', '/daftar', '/register', '/akun', '/update', '/install'], true)) {
            $base = $this->seo->pageMeta('/');

            return array_merge($base, [
                'title' => $base['site_name'] ?? config('app.name', 'Portal Resmi'),
                'canonical' => $this->seo->absoluteUrl($path),
                'robots' => 'noindex,nofollow',
                'json_ld' => null,
            ]);
        }

        // Prestasi detail
        if (preg_match('#^/prestasi/([^/]+)$#', $path, $m)) {
            try {
                $item = \App\Models\Achievement::published()->where('slug', $m[1])->first();
                if ($item) {
                    $base = $this->seo->pageMeta('/prestasi');
                    $desc = $item->excerpt ?: ($base['description'] ?? '');

                    return array_merge($base, [
                        'title' => $item->title.' | '.($base['site_name'] ?? config('app.name', 'Portal Resmi')),
                        'description' => \Illuminate\Support\Str::limit(strip_tags((string) $desc), 160),
                        'canonical' => $this->seo->absoluteUrl($path),
                        'og_type' => 'article',
                        'og_image' => $this->seo->mediaUrl($item->cover_path) ?: ($base['og_image'] ?? null),
                        'robots' => 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
                    ]);
                }
            } catch (\Throwable) {
                // fall through
            }
        }

        // Artikel detail — full meta (GSC + schema)
        if (preg_match('#^/artikel/([^/]+)$#', $path, $m)) {
            $article = Article::published()
                ->with(['category:id,name', 'tags:id,name', 'author:id,name'])
                ->where('slug', $m[1])
                ->first();

            if ($article) {
                return $this->seo->articleMeta($article);
            }
        }

        $pageMap = [
            '/' => '/',
            '/profil' => '/profil',
            '/artikel' => '/artikel',
            '/prestasi' => '/prestasi',
            '/ekstrakurikuler' => '/ekstrakurikuler',
            '/download' => '/download',
        ];

        $pagePath = $pageMap[$path] ?? '/';

        return $this->seo->pageMeta($pagePath === '/' ? '/' : $pagePath);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function injectMeta(string $html, array $meta): string
    {
        $title = e((string) ($meta['title'] ?? config('app.name', 'Portal Resmi')));
        $desc = e((string) ($meta['description'] ?? ''));
        $canonical = e((string) ($meta['canonical'] ?? ''));
        $ogType = e((string) ($meta['og_type'] ?? 'website'));
        $robots = e((string) ($meta['robots'] ?? 'index,follow'));
        $image = ! empty($meta['og_image']) ? e((string) $meta['og_image']) : '';
        $siteName = e((string) ($meta['site_name'] ?? config('app.name', 'Portal Resmi')));

        // Ganti <title>…</title>
        $html = preg_replace(
            '#<title>[^<]*</title>#i',
            '<title>'.$title.'</title>',
            $html,
            1
        ) ?? $html;

        // Ganti meta description jika ada, atau sisipkan
        if ($desc !== '') {
            if (preg_match('#<meta\s+name=["\']description["\'][^>]*>#i', $html)) {
                $html = preg_replace(
                    '#<meta\s+name=["\']description["\'][^>]*>#i',
                    '<meta name="description" content="'.$desc.'" />',
                    $html,
                    1
                ) ?? $html;
            } else {
                $html = str_replace('</head>', '    <meta name="description" content="'.$desc.'" />'."\n</head>", $html);
            }
        }

        $tags = [
            '<meta name="robots" content="'.$robots.'" />',
            '<meta name="googlebot" content="'.$robots.'" />',
            '<link rel="canonical" href="'.$canonical.'" />',
            '<link rel="alternate" hreflang="id" href="'.$canonical.'" />',
            '<link rel="alternate" hreflang="x-default" href="'.$canonical.'" />',
            '<meta property="og:locale" content="id_ID" />',
            '<meta property="og:type" content="'.$ogType.'" />',
            '<meta property="og:site_name" content="'.$siteName.'" />',
            '<meta property="og:title" content="'.$title.'" />',
            '<meta property="og:description" content="'.$desc.'" />',
            '<meta property="og:url" content="'.$canonical.'" />',
            '<meta name="twitter:card" content="summary_large_image" />',
            '<meta name="twitter:title" content="'.$title.'" />',
            '<meta name="twitter:description" content="'.$desc.'" />',
            '<link rel="sitemap" type="application/xml" href="/sitemap.xml" />',
            '<link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs" />',
        ];

        // Google Search Console + Bing — penting di HTML server (bukan hanya SPA)
        if (! empty($meta['google_site_verification'])) {
            $tags[] = '<meta name="google-site-verification" content="'.e((string) $meta['google_site_verification']).'" />';
        }
        if (! empty($meta['bing_site_verification'])) {
            $tags[] = '<meta name="msvalidate.01" content="'.e((string) $meta['bing_site_verification']).'" />';
        }

        // GEO lokal
        if (! empty($meta['geo_region'])) {
            $tags[] = '<meta name="geo.region" content="'.e((string) $meta['geo_region']).'" />';
        }
        if (! empty($meta['geo_placename'])) {
            $tags[] = '<meta name="geo.placename" content="'.e((string) $meta['geo_placename']).'" />';
        }
        if (! empty($meta['geo_position'])) {
            $pos = e((string) $meta['geo_position']);
            $tags[] = '<meta name="geo.position" content="'.$pos.'" />';
            $tags[] = '<meta name="ICBM" content="'.str_replace(';', ', ', $pos).'" />';
        }

        if ($image !== '') {
            $tags[] = '<meta property="og:image" content="'.$image.'" />';
            $tags[] = '<meta property="og:image:alt" content="'.$title.'" />';
            $tags[] = '<meta name="twitter:image" content="'.$image.'" />';
        }

        if (! empty($meta['json_ld']) && is_array($meta['json_ld'])) {
            $json = json_encode($meta['json_ld'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if ($json) {
                $tags[] = '<script type="application/ld+json">'.$json.'</script>';
            }
        }

        $block = "\n    <!-- server-meta (SEO/AEO/GEO + GSC) -->\n    ".implode("\n    ", $tags)."\n";

        if (str_contains($html, '</head>')) {
            $html = str_replace('</head>', $block.'</head>', $html);
        }

        return $html;
    }
}
