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

        return in_array($disk, ['r2', 's3', 'public', 'local'], true) ? $disk : 'public';
    }

    public static function r2Configured(): bool
    {
        $endpoint = (string) (config('filesystems.disks.r2.endpoint') ?: env('R2_ENDPOINT', ''));
        $key = (string) (config('filesystems.disks.r2.key') ?: env('R2_ACCESS_KEY_ID', ''));
        $secret = (string) (config('filesystems.disks.r2.secret') ?: env('R2_SECRET_ACCESS_KEY', ''));
        $bucket = (string) (config('filesystems.disks.r2.bucket') ?: env('R2_BUCKET_NAME', ''));

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
    public static function prefixPath(string $path, ?string $disk = null): string
    {
        $folder = trim((string) (config('filesystems.disks.'.($disk ?: self::diskName()).'.folder', 'scholargate')), '/');
        $path = ltrim($path, '/');

        if ($folder === '') {
            return $path;
        }

        if (str_starts_with($path, $folder.'/')) {
            return $path;
        }

        return $folder.'/'.$path;
    }

    public static function publicBaseUrl(string $disk = 'r2'): string
    {
        $url = (string) config("filesystems.disks.{$disk}.url", '');
        if ($url === '') {
            $url = (string) (config("filesystems.disks.{$disk}.url") ?: env($disk === 's3' ? 'AWS_URL' : 'R2_PUBLIC_URL', ''));
        }

        return rtrim($url, '/');
    }

    public static function url(?string $path, ?string $disk = null): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        $cleanPath = ltrim(str_replace('/storage/', '', $path), '/');

        // 1. Jika disk diset eksplisit sebagai public/local -> selalu gunakan URL lokal
        if ($disk && in_array($disk, ['public', 'local'], true)) {
            return asset('storage/'.$cleanPath);
        }

        // 2. Jika file secara fisik ADA di storage lokal (storage/app/public/...),
        // utamakan sebagai fallback lokal agar tidak broken
        if (! $disk && Storage::disk('public')->exists($cleanPath)) {
            return asset('storage/'.$cleanPath);
        }

        $effectiveDisk = $disk ?: self::diskName();

        // 3. Jika disk R2/S3 dan file tidak ada di lokal -> gunakan CDN / Public R2 URL
        if (in_array($effectiveDisk, ['r2', 's3'], true)) {
            $public = self::publicBaseUrl($effectiveDisk);
            $key = self::prefixPath($cleanPath, $effectiveDisk);

            if ($public !== '') {
                return $public.'/'.$key;
            }

            try {
                return Storage::disk($effectiveDisk)->url($key);
            } catch (\Throwable) {
                return $key;
            }
        }

        return asset('storage/'.$cleanPath);
    }

    /** Resolve a stored public URL back to its provider-relative object path. */
    public static function relativePath(?string $path, ?string $disk = null): ?string
    {
        if (! $path) return null;

        foreach (array_filter([$disk, 'r2', 's3', 'public', 'local']) as $candidate) {
            $base = self::publicBaseUrl($candidate);
            if ($base !== '' && str_starts_with($path, $base.'/')) {
                $path = substr($path, strlen($base) + 1);
                $folder = trim((string) config("filesystems.disks.{$candidate}.folder", ''), '/');
                if ($folder !== '' && str_starts_with($path, $folder.'/')) $path = substr($path, strlen($folder) + 1);
                return ltrim(str_replace('/storage/', '', $path), '/');
            }
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            $urlPath = (string) parse_url($path, PHP_URL_PATH);
            if (str_contains($urlPath, '/storage/')) return ltrim(substr($urlPath, strpos($urlPath, '/storage/') + 9), '/');
            $uploadsPosition = strpos($urlPath, '/uploads/');
            if ($uploadsPosition !== false) return ltrim(substr($urlPath, $uploadsPosition + 1), '/');
            return null;
        }

        return ltrim(str_replace('/storage/', '', $path), '/');
    }

    public static function delete(?string $path, ?string $disk = null): void
    {
        if (! $path || str_starts_with($path, 'http')) {
            // Resolve public URLs only against the recorded provider's own base URL.
            if ($path && str_starts_with($path, 'http')) {
                $public = self::publicBaseUrl($disk ?: self::diskName());
                if ($public && str_starts_with($path, $public.'/')) {
                    $key = substr($path, strlen($public) + 1);
                    Storage::disk($disk ?: self::diskName())->delete($key);

                    return;
                }
            }

            return;
        }

        $disk = $disk ?: self::diskName();
        $key = in_array($disk, ['r2', 's3'], true) ? self::prefixPath($path, $disk) : $path;
        Storage::disk($disk)->delete($key);
    }
}
