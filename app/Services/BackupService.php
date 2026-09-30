<?php

namespace App\Services;

use App\Services\Backup\BackupConfig;
use App\Services\Backup\BackupExporter;
use App\Services\Backup\BackupImporter;
use App\Services\Backup\BackupStorage;

/**
 * Backup / restore konten CMS (JSON portable facade).
 */
class BackupService
{
    public const FORMAT_VERSION = BackupConfig::FORMAT_VERSION;

    public function __construct(
        private BackupStorage $storage,
        private BackupExporter $exporter,
        private BackupImporter $importer
    ) {}

    public function backupDir(): string
    {
        return $this->storage->backupDir();
    }

    /**
     * @return array{filename: string, path: string, size: int, created_at: string, storage_location: string}
     */
    public function create(): array
    {
        return $this->exporter->create();
    }

    /**
     * @return list<array{filename: string, size: int, created_at: string, storage_location: string}>
     */
    public function list(): array
    {
        return $this->storage->list();
    }

    public function absolutePath(string $filename): string
    {
        return $this->storage->absolutePath($filename);
    }

    public function delete(string $filename): void
    {
        $this->storage->delete($filename);
    }

    /**
     * Restore portable JSON → DB aktif (pgsql / mysql / mariadb).
     *
     * @return array{tables: int, rows: int, skipped: list<string>, source: ?string, target: string}
     */
    public function restoreFromJson(string $json, string $mode = 'merge', bool $includeUsers = false): array
    {
        return $this->importer->restoreFromJson($json, $mode, $includeUsers);
    }

    public function extractJsonFromUpload(string $path, string $originalName): string
    {
        return $this->importer->extractJsonFromUpload($path, $originalName);
    }
}
