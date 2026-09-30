<?php

namespace App\Services\Backup;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use ZipArchive;

class BackupExporter
{
    public function __construct(
        private BackupStorage $storage
    ) {}

    /**
     * @return array{filename: string, path: string, size: int, created_at: string, storage_location: string}
     */
    public function create(): array
    {
        $driver = DB::getDriverName();
        $payload = [
            'app' => 'scholargate',
            'version' => BackupConfig::FORMAT_VERSION,
            'portable' => true,
            'created_at' => now()->toIso8601String(),
            'source_connection' => $driver,
            'recommended_target' => 'pgsql',
            'tables' => [],
            'meta' => [
                'note' => 'JSON portable: restore ke MySQL/MariaDB atau PostgreSQL. Disarankan PostgreSQL.',
                'charset' => 'utf-8',
            ],
        ];

        $exportTables = array_merge(BackupConfig::$tables, BackupConfig::$sensitiveTables);
        foreach ($exportTables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            $query = DB::table($table);
            if (Schema::hasColumn($table, 'id')) {
                $query->orderBy('id');
            } elseif ($table === 'article_tag' && Schema::hasColumn($table, 'article_id')) {
                $query->orderBy('article_id')->orderBy('tag_id');
            }
            $rows = $query->get()->map(function ($row) use ($table) {
                $arr = (array) $row;
                if ($table === 'users') {
                    unset($arr['password'], $arr['remember_token']);
                }

                return $this->exportRow($table, $arr);
            })->all();
            $payload['tables'][$table] = $rows;
        }

        $stamp = now()->format('Ymd_His');
        $jsonName = "scholargate_content_{$stamp}.json";
        $jsonPath = $this->storage->backupDir().'/'.$jsonName;
        File::put($jsonPath, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        $zipName = "scholargate_content_{$stamp}.zip";
        $zipPath = $this->storage->backupDir().'/'.$zipName;
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

        $r2Uploaded = false;
        $r2Disk = $this->storage->r2Disk();
        if ($r2Disk) {
            try {
                $r2Folder = config('filesystems.disks.r2.folder', 'scholargate');
                $r2Path = trim($r2Folder, '/').'/backups/'.$filename;
                $r2Disk->put($r2Path, File::get($final));
                $r2Uploaded = true;
            } catch (\Throwable) {
                // Keep local backup if cloud sync fails
            }
        }

        return [
            'filename' => $filename,
            'path' => $final,
            'size' => (int) File::size($final),
            'created_at' => now()->toIso8601String(),
            'source_connection' => $driver,
            'portable' => true,
            'storage_location' => $r2Uploaded ? 'r2_and_local' : 'local',
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function exportRow(string $table, array $row): array
    {
        foreach ($row as $key => $value) {
            if ($value instanceof \DateTimeInterface) {
                $row[$key] = Carbon::instance(\DateTimeImmutable::createFromInterface($value))->toIso8601String();
                continue;
            }

            if (in_array($key, BackupConfig::$jsonColumns[$table] ?? [], true)) {
                if (is_string($value) && $value !== '') {
                    $decoded = json_decode($value, true);
                    $row[$key] = json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
                } elseif (is_object($value)) {
                    $row[$key] = json_decode(json_encode($value), true);
                }
                continue;
            }

            if (in_array($key, BackupConfig::$boolColumns[$table] ?? [], true)) {
                if (is_bool($value)) {
                    $row[$key] = $value;
                } elseif (is_int($value) || is_string($value)) {
                    $row[$key] = in_array($value, [1, '1', 't', 'true', true], true);
                }
                continue;
            }

            if (in_array($key, BackupConfig::$dateColumns[$table] ?? [], true) && is_string($value) && $value !== '') {
                try {
                    $row[$key] = Carbon::parse($value)->toIso8601String();
                } catch (\Throwable) {
                    // keep as-is
                }
            }
        }

        return $row;
    }
}
