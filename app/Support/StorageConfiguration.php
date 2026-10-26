<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class StorageConfiguration
{
    public static function saved(): array
    {
        if (! Schema::hasTable('settings')) {
            return [];
        }
        $raw = Setting::getValue('storage.configuration');

        return $raw ? json_decode(Crypt::decryptString($raw), true, 512, JSON_THROW_ON_ERROR) : [];
    }

    public static function apply(): void
    {
        $saved = self::saved();
        if (! $saved) {
            return;
        }
        config(['filesystems.default' => $saved['provider']]);
        foreach (['r2', 's3'] as $disk) {
            foreach ($saved[$disk] ?? [] as $key => $value) {
                if ($key === 'private_bucket') {
                    config(["filesystems.ppid_private_buckets.$disk" => $value]);
                } else {
                    config(["filesystems.disks.$disk.$key" => $value]);
                }
            }
            Storage::forgetDisk($disk);
        }
    }

    public static function overview(): array
    {
        $result = ['provider' => MediaStorage::diskName()];
        foreach (['r2', 's3'] as $disk) {
            $result[$disk] = array_intersect_key(config("filesystems.disks.$disk"), array_flip(['endpoint', 'region', 'bucket', 'url', 'folder']));
            $result[$disk]['private_bucket'] = config("filesystems.ppid_private_buckets.$disk", '');
            $result[$disk]['credentials_set'] = filled(config("filesystems.disks.$disk.key")) && filled(config("filesystems.disks.$disk.secret"));
        }

        return $result;
    }
}
