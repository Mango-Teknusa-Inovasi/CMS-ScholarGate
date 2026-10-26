<?php

namespace App\Console\Commands;

use App\Models\Achievement;
use App\Models\Article;
use App\Models\Banner;
use App\Models\GalleryItem;
use App\Models\Media;
use App\Models\Setting;
use App\Models\WelcomeBlock;
use App\Services\ImageOptimizer;
use Illuminate\Console\Command;

class GenerateResponsiveMediaVariants extends Command
{
    protected $signature = 'media:generate-responsive-variants {--dry-run : Tampilkan rencana tanpa menulis berkas} {--limit= : Batasi jumlah media yang diproses}';
    protected $description = 'Buat varian WebP responsif untuk gambar yang sedang dipakai pada konten publik.';

    public function handle(ImageOptimizer $optimizer): int
    {
        $paths = collect()
            ->merge(Banner::where('is_active', true)->pluck('image_path'))
            ->merge(WelcomeBlock::where('is_active', true)->pluck('image_path'))
            ->merge(Article::published()->pluck('cover_path'))
            ->merge(Achievement::published()->pluck('cover_path'))
            ->merge(GalleryItem::where('is_active', true)->pluck('image_path'))
            ->merge(collect(['site_logo', 'logo_path'])->map(fn ($key) => Setting::getValue($key)))
            ->filter(fn ($path) => is_string($path) && $path !== '')
            ->map(fn ($path) => \App\Support\MediaStorage::relativePath($path))->filter()
            ->unique()->values();

        $media = Media::query()->whereIn('path', $paths)->whereIn('mime', [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/avif',
        ])->get();

        $missingCatalog = $paths->diff($media->pluck('path'))->count();
        $registeredCount = $media->count();
        $limit = $this->option('limit');
        if ($limit) $media = $media->take(max(1, (int) $limit));
        $pending = $media->filter(fn (Media $item) => ! $item->variants || count($item->variants) === 0);
        $this->info("Gambar aktif: {$paths->count()}, terdaftar di pustaka media: {$registeredCount}, belum memiliki varian pada cakupan ini: {$pending->count()}.");
        if ($missingCatalog > 0) $this->warn("{$missingCatalog} referensi tidak tercatat sebagai media dan dilewati.");

        if ($this->option('dry-run')) {
            $pending->each(fn (Media $item) => $this->line("Rencana: {$item->disk}:{$item->path}"));
            return self::SUCCESS;
        }

        $failed = 0;
        foreach ($pending as $item) {
            try {
                $variants = $optimizer->generateVariantsForStoredPath($item->path, $item->disk ?: 'public');
                $item->forceFill(['variants' => $variants])->save();
                $this->info("Selesai: {$item->path} (".count($variants).' varian)');
            } catch (\Throwable $exception) {
                $failed++;
                report($exception);
                $this->error("Gagal: {$item->path}. Periksa disk dan akses berkas, lalu jalankan ulang.");
            }
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
