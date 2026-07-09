<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

class ImageOptimizer
{
    public function __construct(private ImageManager $manager) {}

    /**
     * Optimize uploaded image: resize, strip metadata, compress, prefer WebP.
     *
     * @return array{path: string, filename: string, mime: string, size: int, width: ?int, height: ?int, optimized: bool}
     */
    public function store(UploadedFile $file, string $directory = 'uploads', int $maxWidth = 1920, int $quality = 82): array
    {
        $mime = (string) $file->getMimeType();
        $isImage = str_starts_with($mime, 'image/') && ! str_contains($mime, 'svg');

        if (! $isImage) {
            $path = $file->store($directory.'/'.date('Y/m'), 'public');

            return [
                'path' => $path,
                'filename' => $file->getClientOriginalName(),
                'mime' => $mime,
                'size' => (int) (Storage::disk('public')->size($path) ?: 0),
                'width' => null,
                'height' => null,
                'optimized' => false,
            ];
        }

        $image = $this->manager->decodePath($file->getPathname());

        // Auto-orient from EXIF (also handled by config autoOrientation)
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
        $dir = trim($directory, '/').'/'.date('Y/m');
        $filename = $base.'-'.Str::lower(Str::random(6)).'.webp';
        $path = $dir.'/'.$filename;

        $encoded = $image->encodeUsingMediaType('image/webp', quality: $quality);
        Storage::disk('public')->put($path, (string) $encoded);

        return [
            'path' => $path,
            'filename' => $filename,
            'mime' => 'image/webp',
            'size' => (int) (Storage::disk('public')->size($path) ?: 0),
            'width' => $width,
            'height' => $height,
            'optimized' => true,
        ];
    }
}
