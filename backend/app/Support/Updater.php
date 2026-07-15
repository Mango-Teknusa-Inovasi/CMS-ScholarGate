<?php

namespace App\Support;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Easy web/CLI update setelah ganti file (migrate + cache).
 * Tidak pernah migrate:fresh / drop data.
 */
class Updater
{
    public const LOG_PATH = 'last_update.json';

    /**
     * @return array{
     *   pending: list<string>,
     *   ran: list<string>,
     *   pending_count: int,
     *   last_update: ?array
     * }
     */
    public static function status(): array
    {
        $pending = [];
        try {
            // files in database/migrations not yet in migrations table
            $files = collect(File::files(database_path('migrations')))
                ->map(fn ($f) => pathinfo($f->getFilename(), PATHINFO_FILENAME))
                ->sort()
                ->values();

            $ran = collect();
            if (Schema::hasTable('migrations')) {
                $ran = collect(\Illuminate\Support\Facades\DB::table('migrations')->pluck('migration'));
            }

            $pending = $files->diff($ran)->values()->all();
        } catch (Throwable) {
            $pending = [];
        }

        return [
            'pending' => $pending,
            'ran' => [],
            'pending_count' => count($pending),
            'last_update' => self::lastUpdateMeta(),
            'app_version' => self::appVersionHint(),
        ];
    }

    /**
     * Jalankan maintenance update.
     *
     * @return array{ok: bool, message: string, steps: list<array{name: string, ok: bool, output: string}>, pending_after: int}
     */
    public static function run(bool $optimize = true): array
    {
        if (! Installer::isInstalled()) {
            return [
                'ok' => false,
                'message' => 'Aplikasi belum terpasang. Gunakan /install dulu.',
                'steps' => [],
                'pending_after' => 0,
            ];
        }

        $steps = [];

        $steps[] = self::step('migrate', function () {
            Artisan::call('migrate', ['--force' => true]);

            return trim(Artisan::output()) ?: 'Tidak ada migrasi baru / sudah mutakhir.';
        });

        $steps[] = self::step('config:clear', function () {
            Artisan::call('config:clear');

            return trim(Artisan::output()) ?: 'OK';
        });

        $steps[] = self::step('cache:clear', function () {
            Artisan::call('cache:clear');

            return trim(Artisan::output()) ?: 'OK';
        });

        $steps[] = self::step('view:clear', function () {
            Artisan::call('view:clear');

            return trim(Artisan::output()) ?: 'OK';
        });

        $steps[] = self::step('route:clear', function () {
            Artisan::call('route:clear');

            return trim(Artisan::output()) ?: 'OK';
        });

        // storage:link — ignore jika gagal (shared hosting)
        $steps[] = self::step('storage:link', function () {
            try {
                Artisan::call('storage:link');

                return trim(Artisan::output()) ?: 'OK';
            } catch (Throwable $e) {
                return 'Lewati: '.$e->getMessage();
            }
        }, allowFail: true);

        if ($optimize && app()->environment('production')) {
            $steps[] = self::step('config:cache', function () {
                Artisan::call('config:cache');

                return trim(Artisan::output()) ?: 'OK';
            }, allowFail: true);

            $steps[] = self::step('route:cache', function () {
                Artisan::call('route:cache');

                return trim(Artisan::output()) ?: 'OK';
            }, allowFail: true);
        }

        $failed = collect($steps)->contains(fn ($s) => ! $s['ok'] && empty($s['soft']));
        $pendingAfter = self::status()['pending_count'];

        self::markUpdated([
            'ok' => ! $failed,
            'steps' => array_map(fn ($s) => $s['name'].($s['ok'] ? ' ✓' : ' ✗'), $steps),
            'pending_after' => $pendingAfter,
        ]);

        return [
            'ok' => ! $failed,
            'message' => $failed
                ? 'Update selesai dengan error pada beberapa langkah. Cek log.'
                : ($pendingAfter > 0
                    ? 'Update dijalankan, masih ada migrasi tertunda (cek hak DB / error).'
                    : 'Update berhasil. Database & cache sudah dimutakhirkan.'),
            'steps' => $steps,
            'pending_after' => $pendingAfter,
        ];
    }

    /**
     * @param  callable(): string  $fn
     * @return array{name: string, ok: bool, output: string, soft?: bool}
     */
    private static function step(string $name, callable $fn, bool $allowFail = false): array
    {
        try {
            $output = $fn();

            return ['name' => $name, 'ok' => true, 'output' => $output, 'soft' => $allowFail];
        } catch (Throwable $e) {
            report($e);

            return [
                'name' => $name,
                'ok' => $allowFail,
                'output' => $e->getMessage(),
                'soft' => $allowFail,
            ];
        }
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    public static function markUpdated(array $extra = []): void
    {
        File::ensureDirectoryExists(storage_path('app'));
        File::put(
            storage_path('app/'.self::LOG_PATH),
            json_encode(array_merge([
                'updated_at' => now()->toIso8601String(),
                'app' => 'Scholargate CMS',
            ], $extra), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
    }

    public static function lastUpdateMeta(): ?array
    {
        $path = storage_path('app/'.self::LOG_PATH);
        if (! File::exists($path)) {
            return null;
        }
        $data = json_decode(File::get($path), true);

        return is_array($data) ? $data : null;
    }

    public static function appVersionHint(): string
    {
        // Pakai timestamp migrasi terakhir di disk sebagai petunjuk versi skema
        $files = File::files(database_path('migrations'));
        if ($files === []) {
            return 'unknown';
        }
        usort($files, fn ($a, $b) => strcmp($b->getFilename(), $a->getFilename()));

        return pathinfo($files[0]->getFilename(), PATHINFO_FILENAME);
    }
}
