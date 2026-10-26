<?php

namespace App\Console\Commands;

use App\Models\Achievement;
use App\Models\Article;
use App\Models\Banner;
use App\Models\GalleryItem;
use App\Models\Media;
use App\Models\Setting;
use App\Models\WelcomeBlock;
use App\Support\MediaStorage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class AuditPublicMediaReferences extends Command
{
    protected $signature = 'media:audit-public-references';
    protected $description = 'Periksa berkas gambar yang dirujuk konten publik aktif dan tandai referensi yang tidak tersedia.';

    public function handle(): int
    {
        $references = collect()
            ->merge(Banner::where('is_active', true)->pluck('image_path'))
            ->merge(WelcomeBlock::where('is_active', true)->pluck('image_path'))
            ->merge(Article::published()->pluck('cover_path'))
            ->merge(Achievement::published()->pluck('cover_path'))
            ->merge(GalleryItem::where('is_active', true)->pluck('image_path'))
            ->merge(collect(['site_logo', 'logo_path'])->map(fn ($key) => Setting::getValue($key)))
            ->filter(fn ($path) => is_string($path) && $path !== '')
            ->map(fn ($path) => MediaStorage::relativePath($path))->filter()
            ->unique()->values();

        $media = Media::query()->whereIn('path', $references)->get()->keyBy('path');
        $missing = 0;
        foreach ($references as $path) {
            $record = $media->get($path);
            $disk = $record?->disk ?: MediaStorage::diskName();
            $key = in_array($disk, ['r2', 's3'], true) ? MediaStorage::prefixPath($path, $disk) : ltrim($path, '/');
            try {
                $exists = Storage::disk($disk)->exists($key);
            } catch (\Throwable) {
                $exists = false;
            }
            if (! $exists) {
                $missing++;
                $this->error("Tidak ditemukan [{$disk}]: {$path}");
            } elseif (! $record) {
                $this->warn("Berkas tersedia tetapi belum tercatat di pustaka media: {$path}");
            }
        }

        if ($missing === 0) $this->info("Semua {$references->count()} referensi berkas lokal tersedia.");
        return $missing ? self::FAILURE : self::SUCCESS;
    }
}
