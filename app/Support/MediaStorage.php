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
    public static function prefixPath(string $path): string
    {
        $folder = trim((string) (config('filesystems.disks.r2.folder') ?: env('R2_FOLDER_PATH', 'scholargate')), '/');
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
        if (Storage::disk('public')->exists($cleanPath)) {
            return asset('storage/'.$cleanPath);
        }

        $effectiveDisk = $disk ?: self::diskName();

        // 3. Jika disk R2/S3 dan file tidak ada di lokal -> gunakan CDN / Public R2 URL
        if (in_array($effectiveDisk, ['r2', 's3'], true)) {
            $public = self::publicBaseUrl($effectiveDisk);
            $key = self::prefixPath($cleanPath);

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
