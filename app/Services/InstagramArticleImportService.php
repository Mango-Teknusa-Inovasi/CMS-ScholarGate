<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Media;
use App\Support\MediaStorage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class InstagramArticleImportService
{
    public function __construct(
        private InstagramScraperService $scraper,
        private OpenAiArticleService $aiService,
        private ImageOptimizer $imageOptimizer
    ) {}

    /**
     * Proses lengkap: Scrape Instagram -> Unduh Gambar -> Optimasi WebP -> Tulis Artikel AI -> Tata Foto.
     *
     * @param  array{tone?: string, manual_caption?: ?string}  $options
     * @return array<string, mixed>
     */
    public function importFromInstagram(string $url, array $options = [], ?string $userId = null): array
    {
        // 1. Ambil data dari Instagram
        $scraped = $this->scraper->fetchPost($url);

        $caption = trim((string) ($options['manual_caption'] ?? ''));
        if ($caption === '') {
            $caption = $scraped['caption'];
        }

        if ($caption === '' && empty($scraped['images'])) {
            throw new \RuntimeException('Tidak ada caption maupun gambar yang berhasil diambil dari tautan Instagram ini.');
        }

        // 2. Download dan simpan gambar-gambar dari Instagram ke Media Library
        $localImages = [];
        $shortcode = $scraped['shortcode'] ?: 'post';

        foreach ($scraped['images'] as $idx => $remoteImgUrl) {
            try {
                $response = Http::timeout(25)
                    ->withHeaders([
                        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                        'Accept' => 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    ])
                    ->get($remoteImgUrl);

                if (! $response->successful()) {
                    continue;
                }

                $binary = $response->body();
                if (strlen($binary) < 20) {
                    continue; // Bukan gambar valid
                }

                $originalName = "instagram-{$shortcode}-".($idx + 1);
                $stored = $this->imageOptimizer->storeBinary($binary, $originalName, 'uploads');

                // Daftarkan ke Media Library agar admin bisa menggunakannya kembali
                $media = Media::create([
                    'user_id' => $userId,
                    'path' => $stored['path'],
                    'filename' => $stored['filename'],
                    'original_filename' => "{$originalName}.webp",
                    'disk' => $stored['disk'] ?? MediaStorage::diskName(),
                    'mime' => $stored['mime'] ?? 'image/webp',
                    'size' => $stored['size'],
                    'alt' => "Dokumentasi Instagram {$shortcode} foto ".($idx + 1),
                    'width' => $stored['width'],
                    'height' => $stored['height'],
                    'optimized' => true,
                ]);

                $localImages[] = [
                    'id' => $media->id,
                    'path' => $stored['path'],
                    'url' => MediaStorage::url($stored['path']) ?: $stored['url'],
                    'width' => $stored['width'],
                    'height' => $stored['height'],
                    'alt' => $media->alt,
                ];
            } catch (\Throwable $e) {
                Log::warning("Gagal mengunduh gambar {$idx} dari Instagram: ".$e->getMessage());
            }
        }

        // 3. Tentukan Cover Image
        $coverPath = '';
        $coverUrl = '';
        if (! empty($localImages)) {
            $coverPath = $localImages[0]['path'];
            $coverUrl = $localImages[0]['url'];
        }

        // 4. Generate Artikel menggunakan OpenAI
        $aiResult = $this->aiService->generateArticle([
            'caption' => $caption,
            'image_count' => count($localImages),
            'tone' => $options['tone'] ?? 'formal_news',
            'author' => $scraped['author'],
            'date' => $scraped['taken_at'],
        ]);

        // 5. Penataan Gambar (Carousel / Multiple Images)
        $bodyHtml = $aiResult['body_html'];
        $placedIndices = [];

        // Gambar ke-2, 3, dst (index 1..)
        $additionalImages = array_slice($localImages, 1);

        if (! empty($additionalImages)) {
            // A. Ganti placeholder {{IMAGE_1}}, {{IMAGE_2}}, dst jika AI menyisipkannya
            foreach ($additionalImages as $relativeIdx => $img) {
                $placeholderIdx = $relativeIdx + 1; // 1-indexed placeholder
                $token = "{{IMAGE_{$placeholderIdx}}}";

                if (str_contains($bodyHtml, $token)) {
                    $imgFigure = <<<HTML
<figure class="my-6 block overflow-hidden rounded-xl border border-slate-200 shadow-xs dark:border-slate-800">
  <img src="{$img['url']}" alt="{$img['alt']}" class="w-full h-auto object-cover" loading="lazy" />
  <figcaption class="px-4 py-2 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50">Dokumentasi kegiatan (Foto {$placeholderIdx})</figcaption>
</figure>
HTML;
                    $bodyHtml = str_replace($token, $imgFigure, $bodyHtml);
                    $placedIndices[] = $relativeIdx;
                }
            }

            // B. Jika masih ada gambar yang belum terpasang di placeholder, buat galeri rapi di bagian bawah
            $unplacedImages = [];
            foreach ($additionalImages as $relativeIdx => $img) {
                if (! in_array($relativeIdx, $placedIndices, true)) {
                    $unplacedImages[] = $img;
                }
            }

            if (! empty($unplacedImages)) {
                $galleryHtml = "\n\n<h2 class=\"mt-8 mb-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white\">Dokumentasi Kegiatan Tambahan</h2>\n";
                $galleryHtml .= "<div class=\"my-4 grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose\">\n";

                foreach ($unplacedImages as $uIdx => $uImg) {
                    $picNum = $uIdx + 1;
                    $galleryHtml .= <<<HTML
  <figure class="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-xs dark:border-slate-800 dark:bg-slate-900">
    <img src="{$uImg['url']}" alt="{$uImg['alt']}" class="h-56 w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
    <figcaption class="p-2.5 text-center text-xs text-slate-500 dark:text-slate-400">Dokumentasi foto {$picNum}</figcaption>
  </figure>
HTML;
                }

                $galleryHtml .= "\n</div>\n";
                $bodyHtml .= $galleryHtml;
            }
        }

        // Bersihkan token placeholder yang mungkin tidak terpakai
        $bodyHtml = preg_replace('/\{\{IMAGE_\d+\}\}/', '', $bodyHtml);

        $categoryId = null;
        $categoryName = $aiResult['category'] ?? '';
        if ($categoryName !== '') {
            $catSlug = Str::slug($categoryName) ?: 'cat-'.Str::random(4);
            $category = Category::query()->firstOrCreate(
                ['slug' => $catSlug],
                ['name' => $categoryName]
            );
            $categoryId = $category->id;
            $categoryName = $category->name;
        }

        return [
            'title' => $aiResult['title'],
            'slug' => $aiResult['slug'],
            'excerpt' => $aiResult['excerpt'],
            'body' => $bodyHtml,
            'cover_path' => $coverPath,
            'cover_url' => $coverUrl,
            'category_id' => $categoryId,
            'category_name' => $categoryName,
            'tags_text' => implode(', ', $aiResult['tags']),
            'focus_keyword' => $aiResult['focus_keyword'],
            'meta_title' => $aiResult['meta_title'],
            'meta_description' => $aiResult['meta_description'],
            'images_count' => count($localImages),
            'images' => $localImages,
            'source_url' => $url,
            'author' => $scraped['author'],
        ];
    }
}
