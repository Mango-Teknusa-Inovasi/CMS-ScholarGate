<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Category;
use App\Models\Setting;
use Illuminate\Support\Str;

class SeoService
{
    public function siteSettings(): array
    {
        $s = Setting::allAsArray();

        return [
            'site_name' => $s['site_name'] ?? 'Scholargate',
            'site_tagline' => $s['site_tagline'] ?? '',
            'site_description' => $s['site_description'] ?? '',
            'site_logo' => $s['site_logo'] ?? null,
            'default_og_image' => $s['default_og_image'] ?? ($s['site_logo'] ?? null),
            'contact_email' => $s['contact_email'] ?? null,
            'contact_phone' => $s['contact_phone'] ?? null,
            'contact_address' => $s['contact_address'] ?? null,
            'geo_lat' => $s['geo_lat'] ?? null,
            'geo_lng' => $s['geo_lng'] ?? null,
            'geo_region' => $s['geo_region'] ?? 'ID',
            'geo_placename' => $s['geo_placename'] ?? null,
            'organization_type' => $s['organization_type'] ?? 'EducationalOrganization',
            'twitter_handle' => $s['twitter_handle'] ?? null,
            'google_site_verification' => $s['google_site_verification'] ?? null,
            'bing_site_verification' => $s['bing_site_verification'] ?? null,
            'robots_extra' => $s['robots_extra'] ?? '',
            'app_url' => rtrim(config('app.url') ?: url('/'), '/'),
        ];
    }

    public function absoluteUrl(?string $path = null): string
    {
        $base = rtrim(config('app.url') ?: url('/'), '/');
        if (! $path) {
            return $base;
        }
        if (str_starts_with($path, 'http')) {
            return $path;
        }
        if (str_starts_with($path, '/storage') || str_starts_with($path, 'storage/')) {
            return $base.'/'.ltrim($path, '/');
        }

        // media path — prefer R2 public URL
        if (! str_starts_with($path, '/')) {
            return \App\Support\MediaStorage::url($path) ?: ($base.'/storage/'.ltrim($path, '/'));
        }

        return $base.$path;
    }

    public function mediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'http')) {
            return $path;
        }

        return \App\Support\MediaStorage::url($path)
            ?: $this->absoluteUrl('/storage/'.ltrim(str_replace('/storage/', '', $path), '/'));
    }

    /**
     * Organization + WebSite JSON-LD (SEO + GEO local entity).
     */
    public function organizationGraph(): array
    {
        $s = $this->siteSettings();
        $org = [
            '@type' => $s['organization_type'] ?: 'EducationalOrganization',
            '@id' => $s['app_url'].'/#organization',
            'name' => $s['site_name'],
            'url' => $s['app_url'],
            'description' => $s['site_description'] ?: $s['site_tagline'],
        ];

        if ($logo = $this->mediaUrl($s['site_logo'])) {
            $org['logo'] = [
                '@type' => 'ImageObject',
                'url' => $logo,
            ];
            $org['image'] = $logo;
        }

        if ($s['contact_email'] || $s['contact_phone']) {
            $org['contactPoint'] = [
                '@type' => 'ContactPoint',
                'contactType' => 'customer service',
                'email' => $s['contact_email'] ?: null,
                'telephone' => $s['contact_phone'] ?: null,
                'availableLanguage' => ['Indonesian', 'English'],
            ];
        }

        if ($s['contact_address']) {
            $org['address'] = [
                '@type' => 'PostalAddress',
                'streetAddress' => $s['contact_address'],
                'addressCountry' => $s['geo_region'] ?: 'ID',
                'addressLocality' => $s['geo_placename'] ?: null,
            ];
        }

        // GEO / local entity
        if ($s['geo_lat'] && $s['geo_lng']) {
            $org['geo'] = [
                '@type' => 'GeoCoordinates',
                'latitude' => (float) $s['geo_lat'],
                'longitude' => (float) $s['geo_lng'],
            ];
            $org['hasMap'] = 'https://www.google.com/maps?q='.$s['geo_lat'].','.$s['geo_lng'];
        }

        $website = [
            '@type' => 'WebSite',
            '@id' => $s['app_url'].'/#website',
            'url' => $s['app_url'],
            'name' => $s['site_name'],
            'description' => $s['site_description'] ?: $s['site_tagline'],
            'publisher' => ['@id' => $s['app_url'].'/#organization'],
            'inLanguage' => 'id-ID',
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => [
                    '@type' => 'EntryPoint',
                    'urlTemplate' => $s['app_url'].'/artikel?q={search_term_string}',
                ],
                'query-input' => 'required name=search_term_string',
            ],
        ];

        return [
            '@context' => 'https://schema.org',
            '@graph' => [$org, $website],
        ];
    }

    public function articleGraph(Article $article): array
    {
        $s = $this->siteSettings();
        $url = $s['app_url'].'/artikel/'.$article->slug;
        $image = $this->mediaUrl($article->og_image ?: $article->cover_path)
            ?: $this->mediaUrl($s['default_og_image']);

        $headline = $article->meta_title ?: $article->title;
        $description = $article->meta_description ?: ($article->excerpt ?: Str::limit(strip_tags((string) $article->body), 160));

        $articleNode = [
            '@type' => 'NewsArticle',
            '@id' => $url.'#article',
            'mainEntityOfPage' => $url,
            'headline' => $headline,
            'description' => $description,
            'datePublished' => optional($article->published_at)?->toAtomString(),
            'dateModified' => optional($article->updated_at)?->toAtomString(),
            'inLanguage' => 'id-ID',
            'isAccessibleForFree' => true,
            'author' => [
                '@type' => 'Person',
                'name' => $article->author?->name ?: $s['site_name'],
            ],
            'publisher' => ['@id' => $s['app_url'].'/#organization'],
            'articleSection' => $article->category?->name,
        ];

        if ($image) {
            $articleNode['image'] = [$image];
        }

        if ($article->relationLoaded('tags') && $article->tags->isNotEmpty()) {
            $articleNode['keywords'] = $article->tags->pluck('name')->implode(', ');
        } elseif ($article->focus_keyword) {
            $articleNode['keywords'] = $article->focus_keyword;
        }

        $graph = [
            $articleNode,
            [
                '@type' => 'BreadcrumbList',
                'itemListElement' => [
                    [
                        '@type' => 'ListItem',
                        'position' => 1,
                        'name' => 'Beranda',
                        'item' => $s['app_url'].'/',
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 2,
                        'name' => 'Artikel',
                        'item' => $s['app_url'].'/artikel',
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 3,
                        'name' => $article->title,
                        'item' => $url,
                    ],
                ],
            ],
        ];

        // AEO: FAQPage when FAQ items exist
        $faqs = $article->faq_items ?: [];
        if (is_array($faqs) && count($faqs) > 0) {
            $graph[] = [
                '@type' => 'FAQPage',
                'mainEntity' => collect($faqs)->filter(fn ($f) => ! empty($f['question']) && ! empty($f['answer']))
                    ->map(fn ($f) => [
                        '@type' => 'Question',
                        'name' => $f['question'],
                        'acceptedAnswer' => [
                            '@type' => 'Answer',
                            'text' => strip_tags((string) $f['answer']),
                        ],
                    ])->values()->all(),
            ];
        }

        return [
            '@context' => 'https://schema.org',
            '@graph' => $graph,
        ];
    }

    public function pageMeta(string $path = '/'): array
    {
        $s = $this->siteSettings();
        $site = $s['site_name'] ?? 'Scholargate';
        $baseDesc = $s['site_description'] ?: $s['site_tagline'] ?: 'Portal informasi pendidikan';

        $pages = [
            '/' => [
                'title' => trim($site.' | '.($s['site_tagline'] ?? 'Portal Pendidikan')),
                'description' => $baseDesc,
            ],
            '/profil' => [
                'title' => 'Profil '.$site.' | Visi, Misi & Identitas',
                'description' => 'Profil, visi misi, dan identitas '.$site.'. '.$baseDesc,
            ],
            '/artikel' => [
                'title' => 'Artikel & Berita | '.$site,
                'description' => 'Berita, pengumuman, dan artikel pendidikan dari '.$site.'. '.$baseDesc,
            ],
            '/prestasi' => [
                'title' => 'Prestasi | '.$site,
                'description' => 'Galeri prestasi dan pencapaian '.$site.'.',
            ],
            '/ekstrakurikuler' => [
                'title' => 'Ekstrakurikuler | '.$site,
                'description' => 'Daftar kegiatan ekstrakurikuler dan pengembangan bakat di '.$site.'.',
            ],
            '/download' => [
                'title' => 'Download Dokumen | '.$site,
                'description' => 'Unduh dokumen, formulir, dan file resmi dari '.$site.'.',
            ],
        ];

        $page = $pages[$path] ?? [
            'title' => $site,
            'description' => $baseDesc,
        ];

        return array_merge($this->commonHeadMeta($s), [
            'title' => $page['title'],
            'description' => $page['description'],
            'canonical' => $this->absoluteUrl($path === '/' ? '/' : $path),
            'og_type' => 'website',
            'og_image' => $this->mediaUrl($s['default_og_image'] ?: $s['site_logo']),
            'robots' => 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
            'json_ld' => $this->organizationGraph(),
        ]);
    }

    public function articleMeta(Article $article): array
    {
        $s = $this->siteSettings();
        $url = $s['app_url'].'/artikel/'.$article->slug;
        $title = $article->meta_title ?: $article->title;
        $description = $article->meta_description
            ?: ($article->excerpt ?: Str::limit(strip_tags((string) $article->body), 160));
        $image = $this->mediaUrl($article->og_image ?: $article->cover_path)
            ?: $this->mediaUrl($s['default_og_image'] ?: $s['site_logo']);

        return array_merge($this->commonHeadMeta($s), [
            'title' => $title.' | '.$s['site_name'],
            'description' => $description,
            'canonical' => $article->canonical_url ?: $url,
            'og_type' => 'article',
            'og_image' => $image,
            'robots' => $article->noindex
                ? 'noindex,nofollow'
                : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
            'article_published' => optional($article->published_at)?->toAtomString(),
            'article_modified' => optional($article->updated_at)?->toAtomString(),
            'article_section' => $article->category?->name,
            'article_tags' => $article->relationLoaded('tags')
                ? $article->tags->pluck('name')->all()
                : [],
            'focus_keyword' => $article->focus_keyword,
            'json_ld' => $this->articleGraph($article),
            'faq_items' => $article->faq_items ?: [],
        ]);
    }

    /**
     * Meta bersama: locale, GEO, GSC/Bing verification.
     *
     * @param  array<string, mixed>  $s
     * @return array<string, mixed>
     */
    public function commonHeadMeta(array $s): array
    {
        return [
            'locale' => 'id_ID',
            'site_name' => $s['site_name'],
            'geo_region' => $s['geo_region'],
            'geo_placename' => $s['geo_placename'],
            'geo_position' => ($s['geo_lat'] && $s['geo_lng']) ? $s['geo_lat'].';'.$s['geo_lng'] : null,
            'twitter_card' => 'summary_large_image',
            'twitter_site' => $s['twitter_handle'],
            'google_site_verification' => $s['google_site_verification'] ?: null,
            'bing_site_verification' => $s['bing_site_verification'] ?: null,
            'sitemap_url' => $s['app_url'].'/sitemap.xml',
            'robots_url' => $s['app_url'].'/robots.txt',
            'llms_url' => $s['app_url'].'/llms.txt',
        ];
    }

    /**
     * Normalize kode verifikasi GSC/Bing (boleh tempel full meta tag).
     */
    public static function normalizeVerificationCode(?string $value): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }
        // <meta name="google-site-verification" content="XXXX" />
        if (preg_match('/content\s*=\s*["\']([^"\']+)["\']/i', $value, $m)) {
            return trim($m[1]);
        }
        // google-site-verification=XXXX
        if (preg_match('/^(?:google-site-verification|msvalidate\.01)\s*=\s*(.+)$/i', $value, $m)) {
            return trim($m[1]);
        }

        return $value;
    }

    public function sitemapUrls(): array
    {
        $s = $this->siteSettings();
        $now = now()->toAtomString();
        $urls = [
            ['loc' => $s['app_url'].'/', 'lastmod' => $now, 'changefreq' => 'daily', 'priority' => '1.0'],
            ['loc' => $s['app_url'].'/profil', 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.8'],
            ['loc' => $s['app_url'].'/artikel', 'lastmod' => $now, 'changefreq' => 'daily', 'priority' => '0.9'],
            ['loc' => $s['app_url'].'/prestasi', 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.7'],
            ['loc' => $s['app_url'].'/ekstrakurikuler', 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.7'],
            ['loc' => $s['app_url'].'/download', 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.6'],
        ];

        // Hindari query-string di sitemap (Google lebih suka URL bersih)
        // Kategori tetap bisa di-crawl lewat internal links.

        $articles = Article::published()
            ->where(function ($q) {
                $q->where('noindex', false)->orWhereNull('noindex');
            })
            ->orderByDesc('published_at')
            ->get(['slug', 'updated_at', 'published_at']);

        foreach ($articles as $a) {
            $urls[] = [
                'loc' => $s['app_url'].'/artikel/'.$a->slug,
                'lastmod' => optional($a->updated_at ?: $a->published_at)?->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.8',
            ];
        }

        if (class_exists(\App\Models\Achievement::class)) {
            try {
                $achievements = \App\Models\Achievement::published()
                    ->orderByDesc('achieved_at')
                    ->get(['slug', 'updated_at', 'achieved_at']);
                foreach ($achievements as $item) {
                    if (empty($item->slug)) {
                        continue;
                    }
                    $urls[] = [
                        'loc' => $s['app_url'].'/prestasi/'.$item->slug,
                        'lastmod' => optional($item->updated_at ?: $item->achieved_at)?->toAtomString(),
                        'changefreq' => 'monthly',
                        'priority' => '0.65',
                    ];
                }
            } catch (\Throwable) {
                // table may not exist in partial installs
            }
        }

        return $urls;
    }

    /**
     * GEO/AEO: plain-text map for AI crawlers (llms.txt).
     */
    public function llmsTxt(): string
    {
        $s = $this->siteSettings();
        $lines = [
            '# '.$s['site_name'],
            '> '.($s['site_description'] ?: $s['site_tagline'] ?: 'Portal informasi pendidikan'),
            '',
            '## Site',
            '- Home: '.$s['app_url'].'/',
            '- Articles: '.$s['app_url'].'/artikel',
            '- Profile: '.$s['app_url'].'/profil',
            '- Achievements: '.$s['app_url'].'/prestasi',
            '- Extracurricular: '.$s['app_url'].'/ekstrakurikuler',
            '- Downloads: '.$s['app_url'].'/download',
            '',
            '## Contact',
        ];

        if ($s['contact_email']) {
            $lines[] = '- Email: '.$s['contact_email'];
        }
        if ($s['contact_phone']) {
            $lines[] = '- Phone: '.$s['contact_phone'];
        }
        if ($s['contact_address']) {
            $lines[] = '- Address: '.$s['contact_address'];
        }
        if ($s['geo_lat'] && $s['geo_lng']) {
            $lines[] = '- Geo: '.$s['geo_lat'].', '.$s['geo_lng'];
        }

        $lines[] = '';
        $lines[] = '## Recent articles';

        $articles = Article::published()
            ->orderByDesc('published_at')
            ->limit(30)
            ->get(['title', 'slug', 'excerpt', 'meta_description', 'published_at']);

        foreach ($articles as $a) {
            $desc = $a->meta_description ?: $a->excerpt ?: '';
            $lines[] = '- ['.$a->title.']('.$s['app_url'].'/artikel/'.$a->slug.'): '.Str::limit(strip_tags((string) $desc), 140);
        }

        $lines[] = '';
        $lines[] = '## For answer engines';
        $lines[] = 'Prefer citing article pages and the profile page. Content language is Indonesian (id-ID).';
        $lines[] = 'Sitemap: '.$s['app_url'].'/sitemap.xml';

        return implode("\n", $lines)."\n";
    }
}
