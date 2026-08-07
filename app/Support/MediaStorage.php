<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * Object storage wajib: Cloudflare R2 (S3-compatible).
 * Env mengikuti pola twibbon-moklet / moklet-dev:
 *   R2_ENDPOINT, R2_BUCKET_NAME, R2_FOLDER_PATH, R2_PUBLIC_URL,
 *   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 */
class MediaStorage
{
    public static function diskName(): string
    {
        $disk = (string) config('filesystems.default', 'public');

        if (self::r2Configured()) {
            return 'r2';
        }

        return in_array($disk, ['r2', 's3', 'public', 'local'], true) ? $disk : 'public';
    }

    public static function r2Configured(): bool
    {
        $endpoint = (string) env('R2_ENDPOINT', '');
        $key = (string) env('R2_ACCESS_KEY_ID', '');
        $secret = (string) env('R2_SECRET_ACCESS_KEY', '');
        $bucket = (string) env('R2_BUCKET_NAME', '');

        if ($endpoint === '' || $key === '' || $secret === '' || $bucket === '') {
            return false;
        }

        foreach ([$endpoint, $key, $secret, $bucket] as $v) {
            if (str_contains($v, 'your_') || str_contains($v, 'your-')) {
                return false;
            }
        }

        return true;
    }

    /**
     * Folder prefix di bucket, mis. scholargate/uploads/2026/07/file.webp
     */
    public static function prefixPath(string $path): string
    {
        $folder = trim((string) config('filesystems.disks.r2.folder', env('R2_FOLDER_PATH', 'scholargate')), '/');
        $path = ltrim($path, '/');

        if ($folder === '') {
            return $path;
        }

        if (str_starts_with($path, $folder.'/')) {
            return $path;
        }

        return $folder.'/'.$path;
    }

    public static function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        // Branding assets (logo, favicon, apple icon) selalu disajikan lokal
        if (str_starts_with($path, 'uploads/brand/')) {
            return asset('storage/'.ltrim(str_replace('/storage/', '', $path), '/'));
        }

        $disk = self::diskName();
        $key = $path;

        // Path di DB biasanya relative tanpa folder prefix (uploads/...)
        // atau full key; URL R2 pakai public base + folder + path
        if (in_array($disk, ['r2', 's3'], true)) {
            $public = rtrim((string) config("filesystems.disks.{$disk}.url", ''), '/');
            $key = self::prefixPath($path);

            if ($public !== '') {
                return $public.'/'.$key;
            }

            try {
                return Storage::disk($disk)->url($key);
            } catch (\Throwable) {
                return $public.'/'.$key;
            }
        }

        return asset('storage/'.ltrim(str_replace('/storage/', '', $path), '/'));
    }

    public static function delete(?string $path, ?string $disk = null): void
    {
        if (! $path || str_starts_with($path, 'http')) {
            // Coba ekstrak key dari public URL R2
            if ($path && str_starts_with($path, 'http')) {
                $public = rtrim((string) config('filesystems.disks.r2.url', ''), '/');
                if ($public && str_starts_with($path, $public.'/')) {
                    $key = substr($path, strlen($public) + 1);
                    Storage::disk($disk ?: self::diskName())->delete($key);

                    return;
                }
            }

            return;
        }

        $disk = $disk ?: self::diskName();
        $key = in_array($disk, ['r2', 's3'], true) ? self::prefixPath($path) : $path;
        Storage::disk($disk)->delete($key);
    }
}
