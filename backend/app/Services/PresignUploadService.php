<?php

namespace App\Services;

use App\Support\MediaStorage;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Presigned PUT ke R2/S3 untuk file yang TIDAK perlu dikompres di app.
 * Client upload langsung ke object storage (cepat, bypass PHP).
 */
class PresignUploadService
{
    /**
     * @return array{
     *   method: string,
     *   upload_url: string,
     *   headers: array<string, string>,
     *   path: string,
     *   key: string,
     *   public_url: string,
     *   disk: string,
     *   expires_in: int,
     *   mode: string
     * }
     */
    public function create(
        string $originalFilename,
        string $contentType,
        string $directory = 'uploads',
        int $expiresMinutes = 15,
    ): array {
        $disk = MediaStorage::diskName();
        $ext = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION) ?: 'bin');
        $base = Str::slug(pathinfo($originalFilename, PATHINFO_FILENAME)) ?: 'file';
        $base = Str::limit($base, 60, '');
        $filename = $base.'-'.Str::lower(Str::random(8)).'.'.$ext;
        $relative = trim($directory, '/').'/'.date('Y/m').'/'.$filename;
        $key = in_array($disk, ['r2', 's3'], true)
            ? MediaStorage::prefixPath($relative)
            : $relative;

        // Dev tanpa R2: client tetap upload ke API biasa (bukan presign)
        if (! in_array($disk, ['r2', 's3'], true) || ! MediaStorage::r2Configured()) {
            return [
                'method' => 'POST',
                'upload_url' => url('/api/v1/admin/media-library'),
                'headers' => [
                    'Accept' => 'application/json',
                ],
                'path' => $relative,
                'key' => $key,
                'public_url' => MediaStorage::url($relative) ?: '',
                'disk' => $disk,
                'expires_in' => 0,
                'mode' => 'server_fallback',
                'filename' => $filename,
                'content_type' => $contentType,
            ];
        }

        $expires = now()->addMinutes($expiresMinutes);

        try {
            /** @var \Illuminate\Filesystem\FilesystemAdapter $fs */
            $fs = Storage::disk($disk);
            $result = $fs->temporaryUploadUrl($key, $expires, [
                'ContentType' => $contentType,
            ]);

            $uploadUrl = is_array($result) ? ($result['url'] ?? '') : (string) $result;
            $headers = is_array($result) ? ($result['headers'] ?? []) : [];
            // Pastikan Content-Type di header PUT
            if (! isset($headers['Content-Type']) && ! isset($headers['content-type'])) {
                $headers['Content-Type'] = $contentType;
            }
        } catch (\Throwable $e) {
            // Fallback: beberapa adapter R2 butuh client manual
            $client = $this->s3Client($disk);
            $bucket = (string) config("filesystems.disks.{$disk}.bucket");
            $command = $client->getCommand('PutObject', [
                'Bucket' => $bucket,
                'Key' => $key,
                'ContentType' => $contentType,
            ]);
            $request = $client->createPresignedRequest($command, $expires);
            $uploadUrl = (string) $request->getUri();
            $headers = ['Content-Type' => $contentType];
        }

        return [
            'method' => 'PUT',
            'upload_url' => $uploadUrl,
            'headers' => $headers,
            'path' => $relative,
            'key' => $key,
            'public_url' => MediaStorage::url($relative) ?: '',
            'disk' => $disk,
            'expires_in' => $expiresMinutes * 60,
            'mode' => 'presign',
            'filename' => $filename,
            'content_type' => $contentType,
        ];
    }

    private function s3Client(string $disk): \Aws\S3\S3Client
    {
        $config = config("filesystems.disks.{$disk}");

        return new \Aws\S3\S3Client([
            'version' => 'latest',
            'region' => $config['region'] ?? 'auto',
            'endpoint' => $config['endpoint'] ?? null,
            'use_path_style_endpoint' => (bool) ($config['use_path_style_endpoint'] ?? true),
            'credentials' => [
                'key' => $config['key'] ?? '',
                'secret' => $config['secret'] ?? '',
            ],
        ]);
    }
}
