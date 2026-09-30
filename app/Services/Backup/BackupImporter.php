<?php

namespace App\Services\Backup;

use App\Services\HtmlSanitizer;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use ZipArchive;

class BackupImporter
{
    /**
     * Restore portable JSON → DB aktif.
     *
     * @return array{tables: int, rows: int, skipped: list<string>, source: ?string, target: string}
     */
    public function restoreFromJson(string $json, string $mode = 'merge', bool $includeUsers = false): array
    {
        if (strlen($json) > BackupConfig::MAX_JSON_BYTES) {
            throw new \InvalidArgumentException('File backup terlalu besar (maks ~40MB JSON).');
        }

        $data = json_decode($json, true);
        if (! is_array($data) || empty($data['tables']) || ! is_array($data['tables'])) {
            throw new \InvalidArgumentException('Format backup tidak valid.');
        }

        $source = $data['source_connection'] ?? $data['connection'] ?? null;
        $target = $this->driverName();
        $tablesRestored = 0;
        $rows = 0;
        $skipped = [];

        if ($mode === 'merge') {
            $restoreList = BackupConfig::$cmsContentTables;
        } else {
            $restoreList = array_merge(BackupConfig::$cmsContentTables, BackupConfig::$systemSettingTables);
        }

        if ($includeUsers) {
            $restoreList = array_merge($restoreList, BackupConfig::$sensitiveTables);
        } elseif (! empty($data['tables']['users'])) {
            $skipped[] = 'users (abaikan demi keamanan — set include_users=true jika super admin)';
        }

        if ($source && $source !== $target) {
            $skipped[] = "cross-db: sumber={$source} → target={$target} (format portable v".($data['version'] ?? 1).')';
        }

        $this->disableForeignKeys();

        try {
            DB::beginTransaction();
            try {
                foreach ($restoreList as $table) {
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

                            if ($table === 'users') {
                                if (empty($row['password'])) {
                                    unset($row['password']);
                                    if (! isset($row['id']) || ! DB::table('users')->where('id', $row['id'])->exists()) {
                                        continue;
                                    }
                                }
                                if (isset($row['role']) && ! in_array($row['role'], ['admin', 'editor', 'member'], true)) {
                                    $row['role'] = 'member';
                                }
                            }

                            $row = $this->filterColumns($table, $row);
                            if ($row === []) {
                                continue;
                            }

                            $row = $this->importRow($table, $row);
                            $row = $this->sanitizeRestoredRow($table, $row);
                            $row = $this->encodeJsonForDriver($table, $row);

                            DB::table($table)->updateOrInsert(
                                $this->primaryKeyFilter($table, $row),
                                $row
                            );
                            $rows++;
                        }
                    }
                    $tablesRestored++;
                }

                $this->resetPostgresSequences();
                DB::commit();
            } catch (\Throwable $e) {
                DB::rollBack();
                throw $e;
            }
        } finally {
            $this->enableForeignKeys();
        }

        return [
            'tables' => $tablesRestored,
            'rows' => $rows,
            'skipped' => $skipped,
            'source' => is_string($source) ? $source : null,
            'target' => $target,
        ];
    }

    public function extractJsonFromUpload(string $path, string $originalName): string
    {
        if (str_ends_with(strtolower($originalName), '.zip') && class_exists(ZipArchive::class)) {
            $zip = new ZipArchive;
            if ($zip->open($path) !== true) {
                throw new \InvalidArgumentException('Gagal membuka file ZIP.');
            }
            if ($zip->numFiles > 20) {
                $zip->close();
                throw new \InvalidArgumentException('ZIP terlalu banyak entri.');
            }
            $json = null;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if (! $name || str_contains($name, '..') || str_contains($name, '\\')) {
                    continue;
                }
                $stat = $zip->statIndex($i);
                if ($stat && ($stat['size'] ?? 0) > BackupConfig::MAX_JSON_BYTES) {
                    $zip->close();
                    throw new \InvalidArgumentException('Isi ZIP terlalu besar.');
                }
                if (str_ends_with(strtolower($name), '.json')) {
                    $json = $zip->getFromIndex($i);
                    break;
                }
            }
            $zip->close();
            if (! is_string($json) || $json === '') {
                throw new \InvalidArgumentException('ZIP tidak berisi file JSON backup.');
            }
            if (strlen($json) > BackupConfig::MAX_JSON_BYTES) {
                throw new \InvalidArgumentException('File backup terlalu besar.');
            }

            return $json;
        }

        $json = File::get($path);
        if ($json === false || $json === '') {
            throw new \InvalidArgumentException('File backup kosong.');
        }
        if (strlen($json) > BackupConfig::MAX_JSON_BYTES) {
            throw new \InvalidArgumentException('File backup terlalu besar.');
        }

        return $json;
    }

    private function driverName(): string
    {
        $d = DB::getDriverName();

        return match ($d) {
            'mariadb' => 'mariadb',
            'mysql' => 'mysql',
            'pgsql' => 'pgsql',
            'sqlite' => 'sqlite',
            default => $d,
        };
    }

    private function isMysqlFamily(): bool
    {
        return in_array($this->driverName(), ['mysql', 'mariadb'], true);
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function importRow(string $table, array $row): array
    {
        foreach ($row as $key => $value) {
            if ($value === '' && in_array($key, BackupConfig::$dateColumns[$table] ?? [], true)) {
                $row[$key] = null;
                continue;
            }

            if (in_array($key, BackupConfig::$boolColumns[$table] ?? [], true)) {
                $bool = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($bool === null) {
                    $bool = in_array($value, [1, '1', 't', 'true', true], true);
                }
                $row[$key] = $this->isMysqlFamily() ? ($bool ? 1 : 0) : (bool) $bool;
                continue;
            }

            if (in_array($key, BackupConfig::$dateColumns[$table] ?? [], true) && is_string($value) && $value !== '') {
                try {
                    $row[$key] = Carbon::parse($value)->format('Y-m-d H:i:s');
                } catch (\Throwable) {
                    $row[$key] = null;
                }
                continue;
            }

            if (in_array($key, BackupConfig::$jsonColumns[$table] ?? [], true)) {
                if (is_string($value) && $value !== '') {
                    $decoded = json_decode($value, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $row[$key] = $decoded;
                    }
                }
            }
        }

        return $row;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function encodeJsonForDriver(string $table, array $row): array
    {
        foreach (BackupConfig::$jsonColumns[$table] ?? [] as $col) {
            if (! array_key_exists($col, $row)) {
                continue;
            }
            $v = $row[$col];
            if (is_array($v) || is_object($v)) {
                $row[$col] = json_encode($v, JSON_UNESCAPED_UNICODE);
            }
        }

        return $row;
    }

    private function disableForeignKeys(): void
    {
        try {
            $driver = $this->driverName();
            if ($this->isMysqlFamily()) {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');
            } elseif ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = OFF');
            }
        } catch (\Throwable) {
            // Ignore
        }
    }

    private function enableForeignKeys(): void
    {
        try {
            $driver = $this->driverName();
            if ($this->isMysqlFamily()) {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            } elseif ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = ON');
            }
        } catch (\Throwable) {
            // Ignore
        }
    }

    private function resetPostgresSequences(): void
    {
        if ($this->driverName() !== 'pgsql') {
            return;
        }

        $all = array_merge(BackupConfig::$tables, BackupConfig::$sensitiveTables);
        foreach ($all as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'id')) {
                continue;
            }
            if (! preg_match('/^[a-z_]+$/', $table)) {
                continue;
            }
            try {
                $seq = DB::selectOne("SELECT pg_get_serial_sequence('{$table}', 'id') as seq")?->seq;
                if ($seq) {
                    DB::statement(
                        "SELECT setval(
                            '{$seq}',
                            COALESCE((SELECT MAX(id) FROM {$table}), 1),
                            true
                        )"
                    );
                }
            } catch (\Throwable) {
                // abaikan
            }
        }
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function filterColumns(string $table, array $row): array
    {
        try {
            $columns = Schema::getColumnListing($table);
        } catch (\Throwable) {
            return $row;
        }
        if ($columns === []) {
            return $row;
        }

        return array_intersect_key($row, array_flip($columns));
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function sanitizeRestoredRow(string $table, array $row): array
    {
        try {
            /** @var HtmlSanitizer $sanitizer */
            $sanitizer = app(HtmlSanitizer::class);
        } catch (\Throwable) {
            return $row;
        }

        if ($table === 'articles') {
            if (isset($row['body']) && is_string($row['body'])) {
                $row['body'] = $sanitizer->clean($row['body']);
            }
            if (isset($row['excerpt']) && is_string($row['excerpt'])) {
                $row['excerpt'] = $sanitizer->plain($row['excerpt'], 2000);
            }
            if (isset($row['faq_items'])) {
                $faq = is_string($row['faq_items'])
                    ? json_decode($row['faq_items'], true)
                    : $row['faq_items'];
                if (is_array($faq)) {
                    $row['faq_items'] = $sanitizer->cleanFaq($faq);
                }
            }
        }

        if (in_array($table, ['welcome_blocks', 'achievements'], true)
            && isset($row['body']) && is_string($row['body'])) {
            $row['body'] = $sanitizer->clean($row['body']);
        }

        if ($table === 'profile_pages' && isset($row['tabs'])) {
            $tabs = is_string($row['tabs']) ? json_decode($row['tabs'], true) : $row['tabs'];
            if (is_array($tabs)) {
                $row['tabs'] = $sanitizer->cleanTabs($tabs);
            }
        }

        return $row;
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
        if ($table === 'plugins' && isset($row['slug'])) {
            return ['slug' => $row['slug']];
        }
        if ($table === 'article_tag' && isset($row['article_id'], $row['tag_id'])) {
            return ['article_id' => $row['article_id'], 'tag_id' => $row['tag_id']];
        }
        if ($table === 'settings' && isset($row['key'])) {
            return ['key' => $row['key']];
        }

        return $row;
    }
}
