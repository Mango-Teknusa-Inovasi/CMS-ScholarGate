<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Throwable;

class Installer
{
    public const LOCK_PATH = 'installed';

    /**
     * Supported database drivers for first-time install.
     *
     * @return array<string, array{label: string, default_port: int, extension: string}>
     */
    public static function drivers(): array
    {
        return [
            'pgsql' => [
                'label' => 'PostgreSQL (disarankan)',
                'default_port' => 5432,
                'extension' => 'pdo_pgsql',
                'default_user' => 'postgres',
            ],
            'mysql' => [
                'label' => 'MySQL',
                'default_port' => 3306,
                'extension' => 'pdo_mysql',
                'default_user' => 'root',
            ],
            'mariadb' => [
                'label' => 'MariaDB',
                'default_port' => 3306,
                'extension' => 'pdo_mysql',
                'default_user' => 'root',
            ],
        ];
    }

    public static function isInstalled(): bool
    {
        return File::exists(storage_path('app/'.self::LOCK_PATH));
    }

    /**
     * ALLOW_INSTALL=true di .env → izinkan web install (sementara).
     * Setelah sukses installer menulis ALLOW_INSTALL=false.
     */
    public static function allowInstallFlag(): bool
    {
        $raw = env('ALLOW_INSTALL', null);
        if ($raw === null || $raw === '') {
            return false;
        }

        return filter_var($raw, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Indikasi aplikasi sudah pernah di-setup (meski file lock hilang).
     * Cegah re-install / migrate:fresh lewat web.
     */
    public static function looksInstalled(): bool
    {
        if (self::isInstalled()) {
            return true;
        }

        try {
            if (! File::exists(base_path('.env'))) {
                return false;
            }

            // Tabel users + ada admin → hampir pasti sudah live
            if (\Illuminate\Support\Facades\Schema::hasTable('users')) {
                if (User::query()->whereIn('role', ['admin', 'editor'])->exists()) {
                    return true;
                }
                if (User::query()->exists()) {
                    return true;
                }
            }

            if (\Illuminate\Support\Facades\Schema::hasTable('settings')
                && \Illuminate\Support\Facades\Schema::hasTable('migrations')) {
                return true;
            }
        } catch (Throwable) {
            // DB belum dikonfigurasi / tidak connect → anggap belum installed
        }

        return false;
    }

    /**
     * Apakah endpoint web /install boleh dibuka & di-POST.
     *
     * Aturan:
     * - Sudah lock file → tidak
     * - looksInstalled tanpa ALLOW_INSTALL=true → tidak (lock file terhapus pun aman)
     * - Production: butuh ALLOW_INSTALL=true (kecuali fresh total: belum looksInstalled & flag default install-first)
     * - local/testing: boleh jika belum installed
     */
    public static function canInstallViaWeb(): bool
    {
        if (self::isInstalled()) {
            return false;
        }

        // Override eksplisit operator
        if (self::allowInstallFlag()) {
            return true;
        }

        // Sudah ada jejak instalasi di DB → wajib ALLOW_INSTALL=true
        if (self::looksInstalled()) {
            return false;
        }

        // Dev lokal: boleh install pertama
        if (app()->environment(['local', 'testing'])) {
            return true;
        }

        // Production / staging fresh (belum ada jejak):
        // wajib ALLOW_INSTALL=true di .env agar tidak terbuka permanen
        return false;
    }

    /**
     * Pesan singkat kenapa install ditolak (untuk UI / log).
     */
    public static function installBlockedReason(): string
    {
        if (self::isInstalled()) {
            return 'Aplikasi sudah terpasang (lock file).';
        }
        if (self::looksInstalled()) {
            return 'Database sudah berisi data aplikasi. Set ALLOW_INSTALL=true di .env hanya jika Anda yakin ingin re-install (berbahaya).';
        }
        if (app()->environment('production') || app()->environment('staging')) {
            return 'Installer web terkunci. Set ALLOW_INSTALL=true di .env, buka /install sekali, lalu pastikan flag kembali false.';
        }

        return 'Installer tidak tersedia.';
    }

    public static function markInstalled(): void
    {
        File::ensureDirectoryExists(storage_path('app'));
        File::put(
            storage_path('app/'.self::LOCK_PATH),
            json_encode([
                'installed_at' => now()->toIso8601String(),
                'app' => 'Scholargate CMS',
            ], JSON_PRETTY_PRINT)
        );

        // Kunci web installer setelah sukses
        try {
            self::writeEnv(['ALLOW_INSTALL' => 'false']);
        } catch (Throwable) {
            // .env mungkin read-only di beberapa host; lock file tetap utama
        }
    }

    public static function removeLockFile(): void
    {
        $path = storage_path('app/'.self::LOCK_PATH);
        if (File::exists($path)) {
            File::delete($path);
        }
    }

    /**
     * @return array{ok: bool, missing: list<string>}
     */
    public static function checkRequirements(): array
    {
        $missing = [];

        if (version_compare(PHP_VERSION, '8.2.0', '<')) {
            $missing[] = 'PHP >= 8.2 (saat ini '.PHP_VERSION.')';
        }

        foreach (['pdo', 'mbstring', 'openssl', 'tokenizer', 'json', 'ctype', 'fileinfo', 'curl'] as $ext) {
            if (! extension_loaded($ext)) {
                $missing[] = "Ekstensi PHP: {$ext}";
            }
        }

        if (! is_writable(base_path()) && ! File::exists(base_path('.env'))) {
            $missing[] = 'Direktori aplikasi harus writable untuk menulis .env';
        }

        if (! is_writable(storage_path()) || ! is_writable(base_path('bootstrap/cache'))) {
            $missing[] = 'Folder storage/ dan bootstrap/cache/ harus writable';
        }

        return [
            'ok' => $missing === [],
            'missing' => $missing,
        ];
    }

    /**
     * @param  array{
     *   db_connection: string,
     *   db_host: string,
     *   db_port: string|int,
     *   db_database: string,
     *   db_username: string,
     *   db_password?: string|null,
     *   app_url?: string|null,
     *   app_name?: string|null,
     *   admin_name?: string|null,
     *   admin_email?: string|null,
     *   admin_password?: string|null,
     *   seed?: bool
     * }  $input
     * @param  bool  $viaWeb  true = enforce canInstallViaWeb / block reinstall
     * @return array{ok: bool, message: string, errors?: list<string>}
     */
    public static function run(array $input, bool $viaWeb = false): array
    {
        if (self::isInstalled()) {
            return ['ok' => false, 'message' => 'Aplikasi sudah terpasang.'];
        }

        if ($viaWeb && ! self::canInstallViaWeb()) {
            return [
                'ok' => false,
                'message' => self::installBlockedReason(),
            ];
        }

        // Web: tolak jika DB sudah berisi (meski flag true) kecuali ALLOW_INSTALL + belum looks? 
        // Dengan flag true, superuser boleh force — tetap warning di controller.
        if ($viaWeb && self::looksInstalled() && ! self::allowInstallFlag()) {
            return [
                'ok' => false,
                'message' => self::installBlockedReason(),
            ];
        }

        $req = self::checkRequirements();
        if (! $req['ok']) {
            return [
                'ok' => false,
                'message' => 'Persyaratan server belum terpenuhi.',
                'errors' => $req['missing'],
            ];
        }

        $driver = $input['db_connection'] ?? 'pgsql';
        $drivers = self::drivers();
        if (! isset($drivers[$driver])) {
            return ['ok' => false, 'message' => 'Driver database tidak didukung.'];
        }

        if (! extension_loaded($drivers[$driver]['extension'])) {
            return [
                'ok' => false,
                'message' => "Ekstensi {$drivers[$driver]['extension']} belum aktif di PHP.",
            ];
        }

        try {
            self::writeEnv([
                'APP_NAME' => $input['app_name'] ?? 'Scholargate',
                'APP_ENV' => 'production',
                'APP_DEBUG' => 'false',
                'APP_URL' => rtrim($input['app_url'] ?? 'http://localhost', '/'),
                'DB_CONNECTION' => $driver,
                'DB_HOST' => $input['db_host'] ?? '127.0.0.1',
                'DB_PORT' => (string) ($input['db_port'] ?? $drivers[$driver]['default_port']),
                'DB_DATABASE' => $input['db_database'] ?? 'scholargate',
                'DB_USERNAME' => $input['db_username'] ?? ($drivers[$driver]['default_user'] ?? 'root'),
                'DB_PASSWORD' => (string) ($input['db_password'] ?? ''),
                'SESSION_DRIVER' => 'database',
                'CACHE_STORE' => 'database',
                'QUEUE_CONNECTION' => 'database',
                'FILESYSTEM_DISK' => 'public',
                // Kunci installer web segera di .env (markInstalled juga set ulang)
                'ALLOW_INSTALL' => 'false',
            ]);

            if (function_exists('opcache_reset')) {
                @opcache_reset();
            }

            // Reload .env into runtime
            if (class_exists(\Dotenv\Dotenv::class)) {
                $dotenv = \Dotenv\Dotenv::createMutable(base_path());
                $dotenv->load();
            }

            // Gunakan file cache saat install (tabel cache belum ada)
            config([
                'cache.default' => 'file',
                'session.driver' => 'file',
                'queue.default' => 'sync',
                'database.default' => $driver,
                "database.connections.{$driver}.host" => $input['db_host'] ?? '127.0.0.1',
                "database.connections.{$driver}.port" => $input['db_port'] ?? $drivers[$driver]['default_port'],
                "database.connections.{$driver}.database" => $input['db_database'] ?? 'scholargate',
                "database.connections.{$driver}.username" => $input['db_username'] ?? ($driver === 'pgsql' ? 'postgres' : 'root'),
                "database.connections.{$driver}.password" => (string) ($input['db_password'] ?? ''),
            ]);

            try {
                Artisan::call('config:clear');
            } catch (Throwable) {
                // ignore
            }

            DB::purge($driver);
            DB::setDefaultConnection($driver);
            DB::connection($driver)->getPdo();

            $envContent = File::get(base_path('.env'));
            if (! preg_match('/^APP_KEY=base64:.+/m', $envContent)) {
                Artisan::call('key:generate', ['--force' => true]);
            }

            Artisan::call('migrate:fresh', ['--force' => true, '--database' => $driver]);

            $seed = filter_var($input['seed'] ?? true, FILTER_VALIDATE_BOOLEAN);
            if ($seed) {
                Artisan::call('db:seed', ['--force' => true]);
            }

            $adminEmail = $input['admin_email'] ?? 'admin@scholargate.test';
            $adminPassword = $input['admin_password'] ?? 'password';
            $adminName = $input['admin_name'] ?? 'Admin Scholargate';

            User::query()->updateOrCreate(
                ['email' => $adminEmail],
                [
                    'name' => $adminName,
                    'password' => $adminPassword,
                    'role' => 'admin',
                ]
            );

            try {
                Artisan::call('storage:link');
            } catch (Throwable) {
                // symlink may fail on some shared hosts; ignore
            }

            self::markInstalled();

            return [
                'ok' => true,
                'message' => 'Instalasi berhasil. Silakan login ke panel admin.',
            ];
        } catch (Throwable $e) {
            return [
                'ok' => false,
                'message' => 'Instalasi gagal: '.$e->getMessage(),
                'errors' => [$e->getMessage()],
            ];
        }
    }

    /**
     * @param  array<string, string>  $values
     */
    public static function writeEnv(array $values): void
    {
        $envPath = base_path('.env');
        $examplePath = base_path('.env.example');

        if (! File::exists($envPath)) {
            if (File::exists($examplePath)) {
                File::copy($examplePath, $envPath);
            } else {
                File::put($envPath, '');
            }
        }

        $content = File::get($envPath);

        foreach ($values as $key => $value) {
            $escaped = self::escapeEnvValue($value);
            $pattern = "/^{$key}=.*$/m";
            $line = "{$key}={$escaped}";

            if (preg_match($pattern, $content)) {
                $content = preg_replace($pattern, $line, $content) ?? $content;
            } else {
                $content = rtrim($content).PHP_EOL.$line.PHP_EOL;
            }
        }

        File::put($envPath, $content);
    }

    public static function escapeEnvValue(string $value): string
    {
        if ($value === '') {
            return '';
        }

        if (preg_match('/\s|#|"|\'/', $value)) {
            return '"'.str_replace(['\\', '"'], ['\\\\', '\\"'], $value).'"';
        }

        return $value;
    }

    public static function spaExists(): bool
    {
        return File::exists(public_path('spa/index.html'))
            || File::exists(public_path('spa/.vite/manifest.json'));
    }
}
