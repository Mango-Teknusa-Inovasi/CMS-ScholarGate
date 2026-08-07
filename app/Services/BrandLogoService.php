<?php

namespace App\Services;

use App\Models\Media;
use App\Models\Setting;
use App\Support\MediaStorage;
use App\Support\PublicSettings;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Interfaces\ImageInterface;
use Intervention\Image\ImageManager;

/**
 * Unggah logo situs → generate & simpan semua brand asset:
 * site_logo, logo_path, favicon (16/32), apple-touch-icon, OG fallback (jika kosong).
 */
class BrandLogoService
{
    public function __construct(private ImageManager $manager) {}

    /**
     * @return array{
     *   settings: array<string, mixed>,
     *   paths: array<string, string>,
     *   urls: array<string, string|null>,
     *   media_ids: list<string>
     * }
     */
    public function processUpload(UploadedFile $file, ?string $userId = null, ?string $alt = null): array
    {
        $mime = strtolower((string) $file->getMimeType());
        if (! ImageOptimizer::needsAppCompression($mime)) {
            throw new \InvalidArgumentException(
                'Logo harus berupa gambar raster (JPG, PNG, WebP, GIF). SVG tidak diizinkan.'
            );
        }

        $pathName = $file->getPathname();
        $stamp = now()->format('YmdHis');
        $baseDir = 'uploads/brand/'.$stamp;
        $disk = 'public'; // Brand assets (logo, favicon, PWA icons) disimpan lokal
        $paths = [];
        $mediaIds = [];
        $altBase = $alt ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) ?: 'Logo situs';

        $b64s = [];

        // 1) Logo header (horizontal WebP, max 800px wide)
        $logoImg = $this->decodeOriented($pathName);
        $logoImg->scaleDown(width: 800);
        $logoBin = (string) $logoImg->encodeUsingMediaType('image/webp', quality: 90);
        $paths['site_logo'] = $this->putEncoded(
            $logoBin,
            $baseDir.'/logo.webp',
            'image/webp',
            $disk
        );
        $paths['logo_path'] = $paths['site_logo']; // alias legacy
        $b64s['site_logo_b64'] = base64_encode($logoBin);
        $b64s['logo_path_b64'] = $b64s['site_logo_b64'];

        $mediaIds[] = $this->registerMedia(
            $paths['site_logo'],
            'logo.webp',
            $file->getClientOriginalName(),
            'image/webp',
            $logoImg->width(),
            $logoImg->height(),
            $userId,
            $altBase,
            $disk
        );

        // 2) Favicon 32×32 PNG (contain, soft white pad — readable di tab)
        $fav32 = $this->decodeOriented($pathName);
        $fav32->contain(32, 32, 'ffffff');
        $fav32Bin = (string) $fav32->encodeUsingMediaType('image/png');
        $paths['favicon_path'] = $this->putEncoded(
            $fav32Bin,
            $baseDir.'/favicon-32.png',
            'image/png',
            $disk
        );
        $b64s['favicon_path_b64'] = base64_encode($fav32Bin);

        $mediaIds[] = $this->registerMedia(
            $paths['favicon_path'],
            'favicon-32.png',
            'favicon-32.png',
            'image/png',
            32,
            32,
            $userId,
            $altBase.' (favicon)',
            $disk
        );

        // 3) Favicon 16×16
        $fav16 = $this->decodeOriented($pathName);
        $fav16->contain(16, 16, 'ffffff');
        $fav16Bin = (string) $fav16->encodeUsingMediaType('image/png');
        $paths['favicon_16_path'] = $this->putEncoded(
            $fav16Bin,
            $baseDir.'/favicon-16.png',
            'image/png',
            $disk
        );
        $b64s['favicon_16_path_b64'] = base64_encode($fav16Bin);

        // 4) Apple touch 180×180
        $apple = $this->decodeOriented($pathName);
        $apple->contain(180, 180, 'ffffff');
        $appleBin = (string) $apple->encodeUsingMediaType('image/png');
        $paths['apple_touch_icon_path'] = $this->putEncoded(
            $appleBin,
            $baseDir.'/apple-touch-icon.png',
            'image/png',
            $disk
        );
        $b64s['apple_touch_icon_path_b64'] = base64_encode($appleBin);

        $mediaIds[] = $this->registerMedia(
            $paths['apple_touch_icon_path'],
            'apple-touch-icon.png',
            'apple-touch-icon.png',
            'image/png',
            180,
            180,
            $userId,
            $altBase.' (apple touch)',
            $disk
        );

        // 5) OG fallback 1200×630 — hanya jika belum di-set manual
        $existingOg = (string) Setting::getValue('default_og_image', '');
        if ($existingOg === '') {
            $og = $this->decodeOriented($pathName);
            $og->contain(1200, 630, 'f7f4ef');
            $ogBin = (string) $og->encodeUsingMediaType('image/webp', quality: 85);
            $paths['default_og_image'] = $this->putEncoded(
                $ogBin,
                $baseDir.'/og-default.webp',
                'image/webp',
                $disk
            );
            $b64s['default_og_image_b64'] = base64_encode($ogBin);

            $mediaIds[] = $this->registerMedia(
                $paths['default_og_image'],
                'og-default.webp',
                'og-default.webp',
                'image/webp',
                1200,
                630,
                $userId,
                $altBase.' (OG)',
                $disk
            );
        }

        foreach ($paths as $key => $path) {
            if (PublicSettings::isAllowed($key)) {
                Setting::setValue($key, $path, 'brand');
            }
        }
        foreach ($b64s as $key => $b64) {
            Setting::setValue($key, $b64, 'brand');
        }

        $settings = PublicSettings::filterPublic(Setting::allAsArray());
        $urls = [];
        foreach ($paths as $key => $path) {
            $urls[$key] = MediaStorage::url($path);
        }

        return [
            'settings' => $settings,
            'paths' => $paths,
            'urls' => $urls,
            'media_ids' => array_values(array_filter($mediaIds)),
        ];
    }

    /**
     * Hapus path brand (logo + favicon + apple). OG hanya dihapus jika sama dengan logo-derived path pattern.
     *
     * @return array<string, mixed>
     */
    public function clearBrandAssets(bool $clearOgIfAuto = true): array
    {
        $keys = ['site_logo', 'logo_path', 'favicon_path', 'favicon_16_path', 'apple_touch_icon_path'];
        foreach ($keys as $key) {
            Setting::setValue($key, '', 'brand');
        }

        if ($clearOgIfAuto) {
            $og = (string) Setting::getValue('default_og_image', '');
            if ($og !== '' && str_contains($og, '/brand/') && str_contains($og, 'og-default')) {
                Setting::setValue('default_og_image', '', 'brand');
            }
        }

        return PublicSettings::filterPublic(Setting::allAsArray());
    }

    /**
     * @return array{favicon:?string,favicon_16:?string,apple:?string,logo:?string}
     */
    public static function brandUrls(): array
    {
        $s = Setting::allAsArray();

        return [
            'favicon' => MediaStorage::url($s['favicon_path'] ?? null),
            'favicon_16' => MediaStorage::url($s['favicon_16_path'] ?? null),
            'apple' => MediaStorage::url($s['apple_touch_icon_path'] ?? null),
            'logo' => MediaStorage::url($s['site_logo'] ?? ($s['logo_path'] ?? null)),
        ];
    }

    private function decodeOriented(string $pathName): ImageInterface
    {
        $image = $this->manager->decodePath($pathName);
        try {
            $image->orient();
        } catch (\Throwable) {
            // ignore EXIF orient failures
        }

        return $image;
    }

    private function putEncoded(mixed $encoded, string $relative, string $contentType, string $disk): string
    {
        $binary = (string) $encoded;
        $relative = ltrim($relative, '/');
        $key = in_array($disk, ['r2', 's3'], true)
            ? MediaStorage::prefixPath($relative)
            : $relative;

        $tmpRelative = 'tmp/brand/'.Str::uuid().'.bin';
        Storage::disk('local')->put($tmpRelative, $binary);
        $tmpAbsolute = Storage::disk('local')->path($tmpRelative);

        try {
            $stream = fopen($tmpAbsolute, 'r');
            if ($stream === false) {
                throw new \RuntimeException('Gagal membuka temporary brand asset.');
            }
            try {
                Storage::disk($disk)->put($key, $stream, [
                    'ContentType' => $contentType,
                    'CacheControl' => 'public, max-age=31536000',
                ]);
            } finally {
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }
        } finally {
            Storage::disk('local')->delete($tmpRelative);
        }

        return $relative;
    }

    private function registerMedia(
        string $path,
        string $filename,
        string $original,
        string $mime,
        ?int $width,
        ?int $height,
        ?string $userId,
        string $alt,
        string $disk,
    ): string {
        $size = 0;
        try {
            $key = in_array($disk, ['r2', 's3'], true) ? MediaStorage::prefixPath($path) : $path;
            $size = (int) Storage::disk($disk)->size($key);
        } catch (\Throwable) {
            // ignore size lookup failures
        }

        $media = Media::query()->create([
            'user_id' => $userId,
            'path' => $path,
            'filename' => $filename,
            'original_filename' => $original,
            'disk' => $disk,
            'mime' => $mime,
            'size' => $size,
            'alt' => $alt,
            'width' => $width,
            'height' => $height,
            'optimized' => true,
        ]);

        return (string) $media->id;
    }
}
