<?php

namespace App\Services;

use App\Support\MediaStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

/**
 * Path A — gambar yang HARUS dikompres app:
 * 1) proses di lokal (temp)
 * 2) simpan hasil ke local tmp
 * 3) upload ke R2
 * 4) hapus tmp lokal
 */
class ImageOptimizer
{
    public function __construct(private ImageManager $manager) {}

    /**
     * @return array{path: string, filename: string, mime: string, size: int, width: ?int, height: ?int, optimized: bool, disk: string, url: string, mode: string}
     */
    public function store(UploadedFile $file, string $directory = 'uploads', int $maxWidth = 1920, int $quality = 82): array
    {
        $disk = MediaStorage::diskName();
        $mime = (string) $file->getMimeType();
        $isCompressibleImage = self::needsAppCompression($mime);

        // File non-kompres seharusnya lewat presign; fallback server put jika tetap dipanggil.
        if (! $isCompressibleImage) {
            return $this->storeRawViaTemp($file, $directory, $disk, $mime);
        }

        // 1) Proses di memori/disk lokal
        $image = $this->manager->decodePath($file->getPathname());

        try {
            $image->orient();
        } catch (\Throwable) {
            // ignore
        }

        if ($image->width() > $maxWidth) {
            $image->scaleDown(width: $maxWidth);
        }

        $width = $image->width();
        $height = $image->height();

        $base = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'image';
        $base = Str::limit($base, 60, '');
        $filename = $base.'-'.Str::lower(Str::random(6)).'.webp';
        $relative = trim($directory, '/').'/'.date('Y/m').'/'.$filename;
        $key = $this->objectKey($relative, $disk);

        $encoded = $image->encodeUsingMediaType('image/webp', quality: $quality);
        $binary = (string) $encoded;

        // 2) Tulis lokal dulu (wajib sebelum upload object storage)
        $tmpRelative = 'tmp/optimize/'.date('Y/m').'/'.$filename;
        Storage::disk('local')->put($tmpRelative, $binary);
        $tmpAbsolute = Storage::disk('local')->path($tmpRelative);

        try {
            // 3) Upload ke R2/S3 (atau public lokal)
            $stream = fopen($tmpAbsolute, 'r');
            if ($stream === false) {
                throw new \RuntimeException('Gagal membuka file temporary lokal.');
            }

            try {
                Storage::disk($disk)->put($key, $stream, [
                    'ContentType' => 'image/webp',
                    'CacheControl' => 'public, max-age=31536000',
                ]);
            } finally {
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }
        } finally {
            // 4) Bersihkan tmp lokal
            Storage::disk('local')->delete($tmpRelative);
        }

        return [
            'path' => $relative,
            'filename' => $filename,
            'mime' => 'image/webp',
            'size' => strlen($binary),
            'width' => $width,
            'height' => $height,
            'optimized' => true,
            'disk' => $disk,
            'url' => MediaStorage::url($relative) ?: '',
            'mode' => 'local_then_r2',
        ];
    }

    /**
     * Simpan gambar dari binary/string (misal unduhan dari URL eksternal / CDN Instagram)
     *
     * @return array{path: string, filename: string, mime: string, size: int, width: ?int, height: ?int, optimized: bool, disk: string, url: string, mode: string}
     */
    public function storeBinary(string $binary, string $originalName = 'image', string $directory = 'uploads', int $maxWidth = 1920, int $quality = 82): array
    {
        $disk = MediaStorage::diskName();
        $tempInputRelative = 'tmp/download/'.Str::uuid().'.bin';
        Storage::disk('local')->put($tempInputRelative, $binary);
        $tempInputAbsolute = Storage::disk('local')->path($tempInputRelative);

        try {
            $image = $this->manager->decodePath($tempInputAbsolute);

            try {
                $image->orient();
            } catch (\Throwable) {
                // ignore
            }

            if ($image->width() > $maxWidth) {
                $image->scaleDown(width: $maxWidth);
            }

            $width = $image->width();
            $height = $image->height();

            $base = Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) ?: 'image';
            $base = Str::limit($base, 60, '');
            $filename = $base.'-'.Str::lower(Str::random(6)).'.webp';
            $relative = trim($directory, '/').'/'.date('Y/m').'/'.$filename;
            $key = $this->objectKey($relative, $disk);

            $encoded = $image->encodeUsingMediaType('image/webp', quality: $quality);
            $outputBinary = (string) $encoded;

            $tmpRelative = 'tmp/optimize/'.date('Y/m').'/'.$filename;
            Storage::disk('local')->put($tmpRelative, $outputBinary);
            $tmpAbsolute = Storage::disk('local')->path($tmpRelative);

            try {
                $stream = fopen($tmpAbsolute, 'r');
                if ($stream === false) {
                    throw new \RuntimeException('Gagal membuka file temporary lokal.');
                }

                try {
                    Storage::disk($disk)->put($key, $stream, [
                        'ContentType' => 'image/webp',
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

            return [
                'path' => $relative,
                'filename' => $filename,
                'mime' => 'image/webp',
                'size' => strlen($outputBinary),
                'width' => $width,
                'height' => $height,
                'optimized' => true,
                'disk' => $disk,
                'url' => MediaStorage::url($relative) ?: '',
                'mode' => 'local_then_r2',
            ];
        } finally {
            Storage::disk('local')->delete($tempInputRelative);
        }
    }

    /**
     * Raster image yang perlu diproses app (resize/WebP/EXIF).
     * SVG & PDF & docs → presign (tidak lewat sini).
     */
    public static function needsAppCompression(?string $mime): bool
    {
        $mime = strtolower((string) $mime);

        if ($mime === '' || str_contains($mime, 'svg')) {
            return false;
        }

        return in_array($mime, [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp',
            'image/x-ms-bmp',
            'image/heic',
            'image/heif',
            'image/avif',
        ], true);
    }

    /**
     * @return array{path: string, filename: string, mime: string, size: int, width: ?int, height: ?int, optimized: bool, disk: string, url: string, mode: string}
     */
    private function storeRawViaTemp(UploadedFile $file, string $directory, string $disk, string $mime): array
    {
        $ext = $file->getClientOriginalExtension() ?: 'bin';
        $relative = trim($directory, '/').'/'.date('Y/m').'/'.Str::uuid().'.'.$ext;
        $key = $this->objectKey($relative, $disk);

        $tmpRelative = 'tmp/raw/'.date('Y/m').'/'.basename($key);
        $contents = file_get_contents($file->getRealPath()) ?: '';
        Storage::disk('local')->put($tmpRelative, $contents);
        $tmpAbsolute = Storage::disk('local')->path($tmpRelative);

        try {
            $stream = fopen($tmpAbsolute, 'r');
            if ($stream === false) {
                throw new \RuntimeException('Gagal membuka temporary file.');
            }
            try {
                Storage::disk($disk)->put($key, $stream, [
                    'ContentType' => $mime,
                ]);
            } finally {
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }
        } finally {
            Storage::disk('local')->delete($tmpRelative);
        }

        return [
            'path' => $relative,
            'filename' => $file->getClientOriginalName(),
            'mime' => $mime,
            'size' => (int) ($file->getSize() ?: strlen($contents)),
            'width' => null,
            'height' => null,
            'optimized' => false,
            'disk' => $disk,
            'url' => MediaStorage::url($relative) ?: '',
            'mode' => 'local_then_r2_raw',
        ];
    }

    private function objectKey(string $relative, string $disk): string
    {
        if (in_array($disk, ['r2', 's3'], true)) {
            return MediaStorage::prefixPath($relative);
        }

        return $relative;
    }
}
