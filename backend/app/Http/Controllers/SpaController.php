<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Services\SeoService;
use App\Support\Installer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\File;

class SpaController extends Controller
{
    public function __construct(private SeoService $seo) {}

    /**
     * Serve React SPA + inject meta server-side for bots/crawlers (OG/title).
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

        // Preview draf — noindex
        if (str_starts_with($path, '/preview/')) {
            $base = $this->seo->pageMeta('/');

            return [
                'title' => 'Pratinjau draf | Scholargate',
                'description' => 'Pratinjau konten tidak dipublikasikan.',
                'canonical' => $this->seo->absoluteUrl($path),
                'og_type' => 'article',
                'og_image' => $base['og_image'] ?? null,
                'robots' => 'noindex,nofollow',
                'json_ld' => null,
            ];
        }

        // Admin & auth pages — noindex
        if (str_starts_with($path, '/admin') || in_array($path, ['/login', '/daftar', '/register', '/akun'], true)) {
            $base = $this->seo->pageMeta('/');

            return [
                'title' => 'Scholargate',
                'description' => $base['description'] ?? '',
                'canonical' => $this->seo->absoluteUrl($path),
                'og_type' => 'website',
                'og_image' => $base['og_image'] ?? null,
                'robots' => 'noindex,nofollow',
                'json_ld' => null,
            ];
        }

        // Artikel detail
        if (preg_match('#^/artikel/([^/]+)$#', $path, $m)) {
            $article = Article::published()
                ->with(['category:id,name', 'tags:id,name', 'author:id,name'])
                ->where('slug', $m[1])
                ->first();

            if ($article) {
                $meta = $this->seo->articleMeta($article);

                return [
                    'title' => $meta['title'] ?? $article->title,
                    'description' => $meta['description'] ?? '',
                    'canonical' => $meta['canonical'] ?? $this->seo->absoluteUrl($path),
                    'og_type' => 'article',
                    'og_image' => $meta['og_image'] ?? null,
                    'robots' => $meta['robots'] ?? 'index,follow',
                    'json_ld' => $meta['json_ld'] ?? null,
                ];
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
        $meta = $this->seo->pageMeta($pagePath === '/' ? '/' : $pagePath);

        // Judul page khusus jika path dikenal
        if (isset($pageMap[$path]) && $path !== '/') {
            $meta = $this->seo->pageMeta($path);
        }

        return [
            'title' => $meta['title'] ?? 'Scholargate',
            'description' => $meta['description'] ?? '',
            'canonical' => $meta['canonical'] ?? $this->seo->absoluteUrl($path),
            'og_type' => $meta['og_type'] ?? 'website',
            'og_image' => $meta['og_image'] ?? null,
            'robots' => $meta['robots'] ?? 'index,follow',
            'json_ld' => $meta['json_ld'] ?? null,
        ];
    }

    /**
     * @param  array{title: string, description: string, canonical: string, og_type: string, og_image: ?string, robots: string, json_ld: ?array}  $meta
     */
    private function injectMeta(string $html, array $meta): string
    {
        $title = e($meta['title']);
        $desc = e($meta['description']);
        $canonical = e($meta['canonical']);
        $ogType = e($meta['og_type']);
        $robots = e($meta['robots']);
        $image = $meta['og_image'] ? e($meta['og_image']) : '';

        // Ganti <title>…</title>
        $html = preg_replace(
            '#<title>[^<]*</title>#i',
            '<title>'.$title.'</title>',
            $html,
            1
        ) ?? $html;

        // Ganti meta description jika ada, atau sisipkan
        if (preg_match('#<meta\s+name=["\']description["\'][^>]*>#i', $html)) {
            $html = preg_replace(
                '#<meta\s+name=["\']description["\'][^>]*>#i',
                '<meta name="description" content="'.$desc.'" />',
                $html,
                1
            ) ?? $html;
        }

        $tags = [
            '<meta name="robots" content="'.$robots.'" />',
            '<link rel="canonical" href="'.$canonical.'" />',
            '<meta property="og:locale" content="id_ID" />',
            '<meta property="og:type" content="'.$ogType.'" />',
            '<meta property="og:title" content="'.$title.'" />',
            '<meta property="og:description" content="'.$desc.'" />',
            '<meta property="og:url" content="'.$canonical.'" />',
            '<meta name="twitter:card" content="summary_large_image" />',
            '<meta name="twitter:title" content="'.$title.'" />',
            '<meta name="twitter:description" content="'.$desc.'" />',
        ];

        if ($image !== '') {
            $tags[] = '<meta property="og:image" content="'.$image.'" />';
            $tags[] = '<meta name="twitter:image" content="'.$image.'" />';
        }

        if (! empty($meta['json_ld']) && is_array($meta['json_ld'])) {
            $json = json_encode($meta['json_ld'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if ($json) {
                $tags[] = '<script type="application/ld+json">'.$json.'</script>';
            }
        }

        $block = "\n    <!-- server-meta (bots) -->\n    ".implode("\n    ", $tags)."\n";

        if (str_contains($html, '</head>')) {
            $html = str_replace('</head>', $block.'</head>', $html);
        }

        return $html;
    }
}
