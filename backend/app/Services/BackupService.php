<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use ZipArchive;

// HtmlSanitizer di-resolve via app() saat restore

/**
 * Backup / restore konten CMS (JSON export semua tabel domain).
 * Aman untuk shared hosting tanpa akses shell pg_dump.
 */
class BackupService
{
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
        'extracurriculars',
        'media',
    ];

    /** Tabel sensitif — hanya di-export; restore butuh flag eksplisit + super admin. */
    private array $sensitiveTables = [
        'users',
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
        $payload = [
            'app' => 'scholargate',
            'version' => 1,
            'created_at' => now()->toIso8601String(),
            'connection' => config('database.default'),
            'tables' => [],
        ];

        $exportTables = array_merge($this->tables, $this->sensitiveTables);
        foreach ($exportTables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            $rows = DB::table($table)->get()->map(function ($row) use ($table) {
                $arr = (array) $row;
                // Jangan bawa password hash ke file backup (mitigasi credential dump)
                if ($table === 'users') {
                    unset($arr['password'], $arr['remember_token']);
                }

                return $arr;
            })->all();
            $payload['tables'][$table] = $rows;
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
     * users TIDAK di-restore kecuali $includeUsers = true (super admin).
     *
     * @return array{tables: int, rows: int, skipped: list<string>}
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

        $tablesRestored = 0;
        $rows = 0;
        $skipped = [];

        $restoreList = $this->tables;
        if ($includeUsers) {
            $restoreList = array_merge($restoreList, $this->sensitiveTables);
        } elseif (! empty($data['tables']['users'])) {
            $skipped[] = 'users (abaikan demi keamanan — set include_users=true jika super admin)';
        }

        DB::connection()->getPdo()->beginTransaction();
        try {
            // Disable FK checks when possible
            $driver = DB::getDriverName();
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');
            } elseif ($driver === 'pgsql') {
                DB::statement('SET session_replication_role = replica');
            }

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
                        // users: jangan overwrite password hash kosong; strip password jika kosong
                        if ($table === 'users') {
                            if (empty($row['password'])) {
                                unset($row['password']);
                                // tanpa password: hanya update meta, skip baris baru
                                if (! isset($row['id']) || ! DB::table('users')->where('id', $row['id'])->exists()) {
                                    continue;
                                }
                            }
                            // role hanya admin|editor|member
                            if (isset($row['role']) && ! in_array($row['role'], ['admin', 'editor', 'member'], true)) {
                                $row['role'] = 'member';
                            }
                        }
                        // whitelist kolom yang ada di schema
                        $row = $this->filterColumns($table, $row);
                        if ($row === []) {
                            continue;
                        }
                        // Sanitize HTML meski lewat query builder (bypass model events)
                        $row = $this->sanitizeRestoredRow($table, $row);
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

        return ['tables' => $tablesRestored, 'rows' => $rows, 'skipped' => $skipped];
    }

    public function extractJsonFromUpload(string $path, string $originalName): string
    {
        if (str_ends_with(strtolower($originalName), '.zip') && class_exists(ZipArchive::class)) {
            $zip = new ZipArchive;
            if ($zip->open($path) !== true) {
                throw new \InvalidArgumentException('Gagal membuka file ZIP.');
            }
            // Zip bomb / path traversal guard
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
                    $clean = $sanitizer->cleanFaq($faq);
                    $row['faq_items'] = is_string($row['faq_items'] ?? null)
                        ? json_encode($clean, JSON_UNESCAPED_UNICODE)
                        : $clean;
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
                $clean = $sanitizer->cleanTabs($tabs);
                $row['tabs'] = is_string($row['tabs'] ?? null)
                    ? json_encode($clean, JSON_UNESCAPED_UNICODE)
                    : $clean;
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
