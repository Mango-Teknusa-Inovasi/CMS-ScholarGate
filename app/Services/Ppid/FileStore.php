<?php

namespace App\Services\Ppid;

use App\Models\Ppid\Attachment;
use App\Support\MediaStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class FileStore
{
    public function ready(): bool
    {
        $disk = MediaStorage::diskName();

        return in_array($disk, ['local', 'public']) || (filled(config("filesystems.ppid_private_buckets.$disk")) && config("filesystems.ppid_private_buckets.$disk") !== config("filesystems.disks.$disk.bucket"));
    }

    public function location(string $disk, bool $private): array
    {
        if (in_array($disk, ['local', 'public'])) {
            return ['driver' => 'local', 'root' => storage_path($private ? 'app/private' : 'app/public'), 'url' => $private ? null : url('/storage')];
        }
        if ($private && ! $this->ready()) {
            throw ValidationException::withMessages(['file' => 'Atur bucket privat terpisah di konfigurasi penyimpanan sebelum mengunggah berkas PPID.']);
        }
        $config = config("filesystems.disks.$disk");

        return array_filter(array_intersect_key(array_replace($config, ['bucket' => $private ? config("filesystems.ppid_private_buckets.$disk") : $config['bucket'], 'url' => $private ? null : ($config['url'] ?? null)]), array_flip(['driver', 'endpoint', 'region', 'bucket', 'url', 'use_path_style_endpoint'])), fn ($v) => $v !== null);
    }

    public function filesystem(string $disk, array $location)
    {
        return Storage::build(array_replace(config("filesystems.disks.$disk", []), ['url' => null], $location, ['throw' => true, 'visibility' => 'private']));
    }

    public function put(UploadedFile $file, array $owner): Attachment
    {
        validator(['file' => $file], ['file' => 'required|file|max:20480|mimes:pdf,jpg,jpeg,png,webp,doc,docx,xls,xlsx,ppt,pptx,txt,csv'])->validate();
        $disk = MediaStorage::diskName();
        $location = $this->location($disk, true);
        $key = MediaStorage::prefixPath('ppid/private/'.Str::uuid().'.'.$file->extension(), $disk);
        $stream = fopen($file->getRealPath(), 'rb');
        try {
            $this->filesystem($disk, $location)->writeStream($key, $stream, ['ContentType' => $file->getMimeType()]);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }
        try {
            return Attachment::create($owner + ['name' => mb_substr(basename($file->getClientOriginalName()), 0, 240), 'mime' => $file->getMimeType(), 'size' => $file->getSize(), 'checksum' => hash_file('sha256', $file->getRealPath()), 'disk' => $disk, 'storage_location' => $location, 'object_key' => $key]);
        } catch (\Throwable $e) {
            $this->filesystem($disk, $location)->delete($key);
            throw $e;
        }
    }

    public function publish(Attachment $file): void
    {
        if ($file->public_key) {
            return;
        }
        $disk = MediaStorage::diskName();
        $location = $this->location($disk, false);
        $key = MediaStorage::prefixPath('ppid/published/'.Str::uuid().'.'.pathinfo($file->name, PATHINFO_EXTENSION), $disk);
        $stream = $this->filesystem($file->disk, $file->storage_location)->readStream($file->object_key);
        try {
            $this->filesystem($disk, $location)->writeStream($key, $stream, ['CacheControl' => 'public, max-age=0, must-revalidate', 'ContentType' => $file->mime]);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }
        try {
            $file->update(['public_disk' => $disk, 'public_location' => $location, 'public_key' => $key]);
        } catch (\Throwable $e) {
            $this->filesystem($disk, $location)->delete($key);
            throw $e;
        }
    }

    public function withdraw(Attachment $file): void
    {
        if (! $file->public_key) {
            return;
        }
        $this->filesystem($file->public_disk, $file->public_location)->delete($file->public_key);
        $file->update(['public_key' => null, 'public_disk' => null, 'public_location' => null]);
    }

    public function publicUrl(Attachment $file): string
    {
        $location = $file->public_location;

        return ! empty($location['url']) ? rtrim($location['url'], '/').'/'.$file->public_key : url('/api/v1/ppid/files/'.$file->id);
    }

    public function response(Attachment $file, bool $public = false)
    {
        return $this->filesystem($public ? $file->public_disk : $file->disk, $public ? $file->public_location : $file->storage_location)
            ->download($public ? $file->public_key : $file->object_key, $file->name, ['Cache-Control' => $public ? 'public, max-age=0, must-revalidate' : 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}
