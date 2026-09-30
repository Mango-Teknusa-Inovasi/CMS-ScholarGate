<?php

namespace App\Services\Backup;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class BackupStorage
{
    public function backupDir(): string
    {
        $dir = storage_path('app/backups');
        File::ensureDirectoryExists($dir);

        return $dir;
    }

    public function r2Disk()
    {
        try {
            $key = config('filesystems.disks.r2.key');
            $bucket = config('filesystems.disks.r2.bucket');
            if (! empty($key) && ! empty($bucket)) {
                return Storage::disk('r2');
            }
        } catch (\Throwable) {
            // Ignore if R2 disk is not configured
        }

        return null;
    }

    /**
     * @return list<array{filename: string, size: int, created_at: string, storage_location: string}>
     */
    public function list(): array
    {
        $map = [];

        // Local storage files
        $files = File::files($this->backupDir());
        foreach ($files as $file) {
            $fname = $file->getFilename();
            if (! preg_match('/\.(json|zip)$/i', $fname)) {
                continue;
            }
            $map[$fname] = [
                'filename' => $fname,
                'size' => $file->getSize(),
                'created_at' => date('c', $file->getMTime()),
                'storage_location' => 'local',
            ];
        }

        // Cloudflare R2 Cloud Storage files
        $r2Disk = $this->r2Disk();
        if ($r2Disk) {
            try {
                $r2Folder = config('filesystems.disks.r2.folder', 'scholargate');
                $r2Path = trim($r2Folder, '/').'/backups';
                $r2Files = $r2Disk->files($r2Path);
                foreach ($r2Files as $rf) {
                    $fname = basename($rf);
                    if (! preg_match('/\.(json|zip)$/i', $fname)) {
                        continue;
                    }
                    $size = (int) $r2Disk->size($rf);
                    $mtime = date('c', $r2Disk->lastModified($rf));

                    if (isset($map[$fname])) {
                        $map[$fname]['storage_location'] = 'r2_and_local';
                    } else {
                        $map[$fname] = [
                            'filename' => $fname,
                            'size' => $size,
                            'created_at' => $mtime,
                            'storage_location' => 'r2',
                        ];
                    }
                }
            } catch (\Throwable) {
                // Ignore R2 list errors
            }
        }

        $out = array_values($map);
        usort($out, fn ($a, $b) => strcmp($b['created_at'], $a['created_at']));

        return $out;
    }

    public function absolutePath(string $filename): string
    {
        $filename = basename($filename);
        $localPath = $this->backupDir().'/'.$filename;
        if (File::exists($localPath)) {
            return $localPath;
        }

        // Download from R2 if not present in local storage
        $r2Disk = $this->r2Disk();
        if ($r2Disk) {
            try {
                $r2Folder = config('filesystems.disks.r2.folder', 'scholargate');
                $r2Path = trim($r2Folder, '/').'/backups/'.$filename;
                if ($r2Disk->exists($r2Path)) {
                    $content = $r2Disk->get($r2Path);
                    File::put($localPath, $content);

                    return $localPath;
                }
            } catch (\Throwable) {
                // Ignore
            }
        }

        abort(404, 'File backup tidak ditemukan');
    }

    public function delete(string $filename): void
    {
        $filename = basename($filename);
        $localPath = $this->backupDir().'/'.$filename;
        if (File::exists($localPath)) {
            File::delete($localPath);
        }

        $r2Disk = $this->r2Disk();
        if ($r2Disk) {
            try {
                $r2Folder = config('filesystems.disks.r2.folder', 'scholargate');
                $r2Path = trim($r2Folder, '/').'/backups/'.$filename;
                if ($r2Disk->exists($r2Path)) {
                    $r2Disk->delete($r2Path);
                }
            } catch (\Throwable) {
                // Ignore
            }
        }
    }
}
