<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use ZipArchive;

/**
 * Backup / restore konten CMS (JSON portable).
 *
 * - Aman shared hosting (tanpa pg_dump / mysqldump)
 * - Format portable: MySQL/MariaDB ↔ PostgreSQL (disarankan target: pgsql)
 * - users hanya di-export metadata; restore password butuh include_users
 */
class BackupService
{
    /** Format backup portable (naik versi jika skema berubah). */
    public const FORMAT_VERSION = 2;

    /** @var list<string> Urutan restore (konten). users TIDAK di-restore default. */
    private array $tables = [
        'settings',
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
        'legal_pages',
        'extracurriculars',
        'media',
    ];

    /** Tabel sensitif — export tanpa password; restore butuh flag + super admin. */
    private array $sensitiveTables = [
        'users',
    ];

    /** Kolom JSON (disimpan sebagai struktur di JSON backup). */
    private array $jsonColumns = [
        'articles' => ['faq_items'],
        'profile_pages' => ['tabs'],
    ];

    /** Kolom boolean (normalisasi 0/1 ↔ true/false). */
    private array $boolColumns = [
        'articles' => ['is_featured', 'noindex'],
        'achievements' => ['is_featured'],
        'banners' => ['is_active'],
        'welcome_blocks' => ['is_active'],
        'service_items' => ['is_active'],
        'gallery_items' => ['is_active'],
        'partners' => ['is_active'],
        'contact_infos' => ['is_active'],
        'quick_services' => ['is_active'],
        'downloads' => ['is_active'],
        'menu_items' => ['is_active', 'open_in_new_tab'],
        'extracurriculars' => ['is_active', 'open_in_new_tab'],
        'media' => ['optimized'],
        'legal_pages' => ['is_published'],
    ];

    /** Kolom tanggal/waktu. */
    private array $dateColumns = [
        'articles' => ['published_at', 'created_at', 'updated_at', 'deleted_at', 'preview_token_expires_at'],
        'achievements' => ['achieved_at', 'created_at', 'updated_at'],
        'users' => ['email_verified_at', 'created_at', 'updated_at'],
        'media' => ['created_at', 'updated_at'],
        'settings' => ['created_at', 'updated_at'],
        'categories' => ['created_at', 'updated_at'],
        'tags' => ['created_at', 'updated_at'],
        'banners' => ['created_at', 'updated_at'],
        'welcome_blocks' => ['created_at', 'updated_at'],
        'service_items' => ['created_at', 'updated_at'],
        'gallery_items' => ['created_at', 'updated_at'],
        'partners' => ['created_at', 'updated_at'],
        'contact_infos' => ['created_at', 'updated_at'],
        'quick_services' => ['created_at', 'updated_at'],
        'downloads' => ['published_at', 'created_at', 'updated_at'],
        'menu_items' => ['created_at', 'updated_at'],
        'profile_pages' => ['created_at', 'updated_at'],
        'extracurriculars' => ['created_at', 'updated_at'],
        'legal_pages' => ['created_at', 'updated_at'],
    ];

    private const MAX_JSON_BYTES = 40 * 1024 * 1024; // 40MB

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
        $driver = $this->driverName();
        $payload = [
            'app' => 'scholargate',
            'version' => self::FORMAT_VERSION,
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

        $exportTables = array_merge($this->tables, $this->sensitiveTables);
        foreach ($exportTables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            $rows = DB::table($table)->orderBy('id')->get()->map(function ($row) use ($table) {
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
        $jsonPath = $this->backupDir().'/'.$jsonName;
        File::put($jsonPath, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

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
            'source_connection' => $driver,
            'portable' => true,
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
     * Restore portable JSON → DB aktif (pgsql / mysql / mariadb).
     *
     * @return array{tables: int, rows: int, skipped: list<string>, source: ?string, target: string}
     */
    public function restoreFromJson(string $json, string $mode = 'merge', bool $includeUsers = false): array
    {
        if (strlen($json) > self::MAX_JSON_BYTES) {
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

        $restoreList = $this->tables;
        if ($includeUsers) {
            $restoreList = array_merge($restoreList, $this->sensitiveTables);
        } elseif (! empty($data['tables']['users'])) {
            $skipped[] = 'users (abaikan demi keamanan — set include_users=true jika super admin)';
        }

        if ($source && $source !== $target) {
            $skipped[] = "cross-db: sumber={$source} → target={$target} (format portable v".($data['version'] ?? 1).')';
        }

        DB::connection()->getPdo()->beginTransaction();
        try {
            $this->disableForeignKeys();

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

                        // Setelah sanitize, encode ulang JSON jika masih array
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

            $this->enableForeignKeys();
            $this->resetPostgresSequences();

            DB::connection()->getPdo()->commit();
        } catch (\Throwable $e) {
            DB::connection()->getPdo()->rollBack();
            throw $e;
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
                if ($stat && ($stat['size'] ?? 0) > self::MAX_JSON_BYTES) {
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
            if (strlen($json) > self::MAX_JSON_BYTES) {
                throw new \InvalidArgumentException('File backup terlalu besar.');
            }

            return $json;
        }

        $json = File::get($path);
        if ($json === false || $json === '') {
            throw new \InvalidArgumentException('File backup kosong.');
        }
        if (strlen($json) > self::MAX_JSON_BYTES) {
            throw new \InvalidArgumentException('File backup terlalu besar.');
        }

        return $json;
    }

    private function driverName(): string
    {
        $d = DB::getDriverName();

        // normalisasi
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
    private function exportRow(string $table, array $row): array
    {
        foreach ($row as $key => $value) {
            if ($value instanceof \DateTimeInterface) {
                $row[$key] = Carbon::instance(\DateTimeImmutable::createFromInterface($value))->toIso8601String();
                continue;
            }

            if ($this->columnIs($table, $key, $this->jsonColumns)) {
                if (is_string($value) && $value !== '') {
                    $decoded = json_decode($value, true);
                    $row[$key] = json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
                } elseif (is_object($value)) {
                    $row[$key] = json_decode(json_encode($value), true);
                }
                // array stays array
                continue;
            }

            if ($this->columnIs($table, $key, $this->boolColumns)) {
                if (is_bool($value)) {
                    $row[$key] = $value;
                } elseif (is_int($value) || is_string($value)) {
                    $row[$key] = in_array($value, [1, '1', 't', 'true', true], true);
                }
                continue;
            }

            if ($this->columnIs($table, $key, $this->dateColumns) && is_string($value) && $value !== '') {
                try {
                    $row[$key] = Carbon::parse($value)->toIso8601String();
                } catch (\Throwable) {
                    // keep as-is
                }
            }
        }

        return $row;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function importRow(string $table, array $row): array
    {
        foreach ($row as $key => $value) {
            if ($value === '' && $this->columnIs($table, $key, $this->dateColumns)) {
                $row[$key] = null;
                continue;
            }

            if ($this->columnIs($table, $key, $this->boolColumns)) {
                $bool = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($bool === null) {
                    $bool = in_array($value, [1, '1', 't', 'true', true], true);
                }
                // MySQL/MariaDB: tinyint; PG: boolean — PDO ok dengan bool
                $row[$key] = $this->isMysqlFamily() ? ($bool ? 1 : 0) : (bool) $bool;
                continue;
            }

            if ($this->columnIs($table, $key, $this->dateColumns) && is_string($value) && $value !== '') {
                try {
                    // Format SQL universal Y-m-d H:i:s (aman MySQL + PG)
                    $row[$key] = Carbon::parse($value)->format('Y-m-d H:i:s');
                } catch (\Throwable) {
                    $row[$key] = null;
                }
                continue;
            }

            if ($this->columnIs($table, $key, $this->jsonColumns)) {
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
        foreach ($this->jsonColumns[$table] ?? [] as $col) {
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

    /**
     * @param  array<string, list<string>>  $map
     */
    private function columnIs(string $table, string $column, array $map): bool
    {
        return in_array($column, $map[$table] ?? [], true);
    }

    private function disableForeignKeys(): void
    {
        $driver = $this->driverName();
        if ($this->isMysqlFamily()) {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        } elseif ($driver === 'pgsql') {
            DB::statement('SET session_replication_role = replica');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
        }
    }

    private function enableForeignKeys(): void
    {
        $driver = $this->driverName();
        if ($this->isMysqlFamily()) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        } elseif ($driver === 'pgsql') {
            DB::statement('SET session_replication_role = DEFAULT');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }
    }

    /**
     * Setelah insert ID eksplisit di PostgreSQL, set ulang sequence.
     */
    private function resetPostgresSequences(): void
    {
        if ($this->driverName() !== 'pgsql') {
            return;
        }

        $all = array_merge($this->tables, $this->sensitiveTables);
        foreach ($all as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'id')) {
                continue;
            }
            // Nama tabel hanya dari whitelist internal
            // Hanya nama tabel whitelist (a-z + underscore)
            if (! preg_match('/^[a-z_]+$/', $table)) {
                continue;
            }
            try {
                DB::statement(
                    "SELECT setval(
                        pg_get_serial_sequence('{$table}', 'id'),
                        COALESCE((SELECT MAX(id) FROM {$table}), 1),
                        true
                    )"
                );
            } catch (\Throwable) {
                // tabel tanpa serial / sequence custom — abaikan
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
        if ($table === 'article_tag' && isset($row['article_id'], $row['tag_id'])) {
            return ['article_id' => $row['article_id'], 'tag_id' => $row['tag_id']];
        }
        if ($table === 'settings' && isset($row['key'])) {
            return ['key' => $row['key']];
        }

        return $row;
    }
}
