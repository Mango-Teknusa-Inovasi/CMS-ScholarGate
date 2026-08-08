<?php

namespace App\Services\Plugin;

use App\Models\Plugin;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class PluginManager
{
    /** @var array<string, array<string, mixed>> */
    private array $loadedPlugins = [];

    public function pluginPath(?string $path = null): string
    {
        $base = base_path('plugins');
        File::ensureDirectoryExists($base);

        if (! $path) {
            return $base;
        }

        $clean = str_replace(['..', '\\', "\0"], '', ltrim($path, '/'));

        return $base.'/'.$clean;
    }


    /**
     * Scan `/plugins/` directory and discover all installed plugin manifests.
     *
     * @return array<string, array<string, mixed>>
     */
    public function discover(): array
    {
        $dir = $this->pluginPath();
        if (! File::exists($dir)) {
            return [];
        }

        $plugins = [];
        $folders = File::directories($dir);

        foreach ($folders as $folder) {
            $manifestPath = $folder.'/plugin.json';
            if (! File::exists($manifestPath)) {
                continue;
            }

            $json = json_decode(File::get($manifestPath), true);
            if (! is_array($json) || empty($json['slug'])) {
                continue;
            }

            $slug = $json['slug'];
            $plugins[$slug] = array_merge($json, [
                'folder' => $folder,
                'is_active' => false,
            ]);
        }

        // Sync with active DB plugins
        if (Schema::hasTable('plugins')) {
            $activeSlugs = Plugin::query()->where('is_active', true)->pluck('slug')->toArray();
            foreach ($plugins as $slug => $data) {
                $plugins[$slug]['is_active'] = in_array($slug, $activeSlugs, true);
            }
        }

        return $plugins;
    }

    /**
     * Boot all active plugins: load ServiceProviders, routes, & migrations.
     */
    public function bootActivePlugins(): void
    {
        if (! Schema::hasTable('plugins')) {
            return;
        }

        $activePlugins = Plugin::query()->where('is_active', true)->get();

        foreach ($activePlugins as $plugin) {
            $manifest = $plugin->manifest ?? [];
            $folder = $this->pluginPath($plugin->slug);

            if (! File::exists($folder)) {
                continue;
            }

            // Register PSR-4 Autoloading for plugin namespace if provider specified
            if (! empty($manifest['provider'])) {
                $providerClass = $manifest['provider'];
                if (class_exists($providerClass)) {
                    app()->register($providerClass);
                }
            }

            // Load plugin web routes
            $webRoutes = $folder.'/routes/web.php';
            if (File::exists($webRoutes)) {
                \Illuminate\Support\Facades\Route::middleware('web')->group($webRoutes);
            }

            // Load plugin api routes
            $apiRoutes = $folder.'/routes/api.php';
            if (File::exists($apiRoutes)) {
                \Illuminate\Support\Facades\Route::middleware('api')->prefix('api/v1')->group($apiRoutes);
            }


            // Load plugin migrations
            $migrationsDir = $folder.'/database/migrations';
            if (File::exists($migrationsDir)) {
                app('migrator')->path($migrationsDir);
            }

            $this->loadedPlugins[$plugin->slug] = array_merge($manifest, [
                'folder' => $folder,
                'db_record' => $plugin,
            ]);
        }
    }

    /**
     * Toggle plugin active state.
     */
    public function toggle(string $slug, bool $active): bool
    {
        $discovered = $this->discover();
        if (empty($discovered[$slug])) {
            throw new \InvalidArgumentException("Plugin {$slug} tidak ditemukan.");
        }

        $manifest = $discovered[$slug];

        $record = Plugin::query()->updateOrCreate(
            ['slug' => $slug],
            [
                'name' => $manifest['name'] ?? $slug,
                'version' => $manifest['version'] ?? '1.0.0',
                'description' => $manifest['description'] ?? null,
                'author' => $manifest['author'] ?? null,
                'is_active' => $active,
                'manifest' => $manifest,
            ]
        );

        // Run plugin migrations if activated
        if ($active) {
            $folder = $this->pluginPath($slug);
            $migrationsDir = $folder.'/database/migrations';
            if (File::exists($migrationsDir)) {
                app('migrator')->run($migrationsDir);
            }
        }

        return $record->is_active;
    }
}
