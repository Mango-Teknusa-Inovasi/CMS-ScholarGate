<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use ZipArchive;

/**
 * Backup / restore konten CMS (JSON export semua tabel domain).
 * Aman untuk shared hosting tanpa akses shell pg_dump.
 */
class BackupService
{
    /** @var list<string> */
    private array $tables = [
        'settings',
        'users',
        'categories',
        'tags',
        'articles',
        'article_tag',
        'banners',
        'welcome_blocks',
        'service_items',
        'achievements',
        'gallery_items',
        'partners',
        'contact_infos',
        'quick_services',
        'downloads',
        'menu_items',
        'profile_pages',
        'extracurriculars',
        'media',
    ];

    public function backupDir(): string
    {
        $dir = storage_path('app/backups');
        File::ensureDirectoryExists($dir);

        return $dir;
    }

    /**
     * @return array{filename: string, path: string, size: int, created_at: string}
     */
    public function create(): array
    {
        $payload = [
            'app' => 'scholargate',
            'version' => 1,
            'created_at' => now()->toIso8601String(),
            'connection' => config('database.default'),
            'tables' => [],
        ];

        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            $payload['tables'][$table] = DB::table($table)->get()->map(fn ($row) => (array) $row)->all();
        }

        $stamp = now()->format('Ymd_His');
        $jsonName = "scholargate_content_{$stamp}.json";
        $jsonPath = $this->backupDir().'/'.$jsonName;
        File::put($jsonPath, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        // Zip optional
        $zipName = "scholargate_content_{$stamp}.zip";
        $zipPath = $this->backupDir().'/'.$zipName;
        if (class_exists(ZipArchive::class)) {
            $zip = new ZipArchive;
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                $zip->addFile($jsonPath, $jsonName);
                $zip->close();
                File::delete($jsonPath);
                $final = $zipPath;
                $filename = $zipName;
            } else {
                $final = $jsonPath;
                $filename = $jsonName;
            }
        } else {
            $final = $jsonPath;
            $filename = $jsonName;
        }

        return [
            'filename' => $filename,
            'path' => $final,
            'size' => (int) File::size($final),
            'created_at' => now()->toIso8601String(),
        ];
    }

    /**
     * @return list<array{filename: string, size: int, created_at: string}>
     */
    public function list(): array
    {
        $files = File::files($this->backupDir());
        $out = [];
        foreach ($files as $file) {
            if (! preg_match('/\.(json|zip)$/i', $file->getFilename())) {
                continue;
            }
            $out[] = [
                'filename' => $file->getFilename(),
                'size' => $file->getSize(),
                'created_at' => date('c', $file->getMTime()),
            ];
        }
        usort($out, fn ($a, $b) => strcmp($b['created_at'], $a['created_at']));

        return $out;
    }

    public function absolutePath(string $filename): string
    {
        $filename = basename($filename);
        $path = $this->backupDir().'/'.$filename;
        if (! File::exists($path)) {
            abort(404, 'File backup tidak ditemukan');
        }

        return $path;
    }

    public function delete(string $filename): void
    {
        $path = $this->absolutePath($filename);
        File::delete($path);
    }

    /**
     * Restore dari JSON content backup.
     * Mode: merge (default) | replace (truncate then insert)
     *
     * @return array{tables: int, rows: int}
     */
    public function restoreFromJson(string $json, string $mode = 'merge'): array
    {
        $data = json_decode($json, true);
        if (! is_array($data) || empty($data['tables']) || ! is_array($data['tables'])) {
            throw new \InvalidArgumentException('Format backup tidak valid.');
        }

        $tablesRestored = 0;
        $rows = 0;

        DB::connection()->getPdo()->beginTransaction();
        try {
            // Disable FK checks when possible
            $driver = DB::getDriverName();
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');
            } elseif ($driver === 'pgsql') {
                DB::statement('SET session_replication_role = replica');
            }

            foreach ($this->tables as $table) {
                if (! Schema::hasTable($table) || empty($data['tables'][$table])) {
                    continue;
                }
                $records = $data['tables'][$table];
                if (! is_array($records)) {
                    continue;
                }

                if ($mode === 'replace') {
                    DB::table($table)->delete();
                }

                foreach (array_chunk($records, 100) as $chunk) {
                    foreach ($chunk as $row) {
                        if (! is_array($row)) {
                            continue;
                        }
                        // users: jangan overwrite password hash kosong
                        if ($table === 'users' && empty($row['password'])) {
                            continue;
                        }
                        DB::table($table)->updateOrInsert(
                            $this->primaryKeyFilter($table, $row),
                            $row
                        );
                        $rows++;
                    }
                }
                $tablesRestored++;
            }

            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            } elseif ($driver === 'pgsql') {
                DB::statement('SET session_replication_role = DEFAULT');
            }

            DB::connection()->getPdo()->commit();
        } catch (\Throwable $e) {
            DB::connection()->getPdo()->rollBack();
            throw $e;
        }

        return ['tables' => $tablesRestored, 'rows' => $rows];
    }

    public function extractJsonFromUpload(string $path, string $originalName): string
    {
        if (str_ends_with(strtolower($originalName), '.zip') && class_exists(ZipArchive::class)) {
            $zip = new ZipArchive;
            if ($zip->open($path) !== true) {
                throw new \InvalidArgumentException('Gagal membuka file ZIP.');
            }
            $json = null;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if ($name && str_ends_with(strtolower($name), '.json')) {
                    $json = $zip->getFromIndex($i);
                    break;
                }
            }
            $zip->close();
            if (! is_string($json) || $json === '') {
                throw new \InvalidArgumentException('ZIP tidak berisi file JSON backup.');
            }

            return $json;
        }

        $json = File::get($path);
        if ($json === false || $json === '') {
            throw new \InvalidArgumentException('File backup kosong.');
        }

        return $json;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function primaryKeyFilter(string $table, array $row): array
    {
        if (isset($row['id'])) {
            return ['id' => $row['id']];
        }
        // pivot
        if ($table === 'article_tag' && isset($row['article_id'], $row['tag_id'])) {
            return ['article_id' => $row['article_id'], 'tag_id' => $row['tag_id']];
        }
        if ($table === 'settings' && isset($row['key'])) {
            return ['key' => $row['key']];
        }

        return $row;
    }
}
