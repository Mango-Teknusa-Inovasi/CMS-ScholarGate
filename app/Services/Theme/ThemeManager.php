<?php

namespace App\Services\Theme;

use App\Models\Setting;
use Illuminate\Support\Facades\File;
use ZipArchive;

class ThemeManager
{
    /**
     * Get base directory path for installed themes.
     */
    public function themePath(?string $path = null): string
    {
        $base = resource_path('js/themes');
        File::ensureDirectoryExists($base);

        if (! $path) {
            return $base;
        }

        $clean = str_replace(['..', '\\', "\0"], '', ltrim($path, '/'));

        return $base.'/'.$clean;
    }

    /**
     * Get the active theme slug.
     */
    public function getActiveTheme(): string
    {
        $active = (string) Setting::getValue('active_theme', 'default');

        // Ensure active theme directory exists, otherwise fallback to default
        if ($active !== 'default' && ! File::exists($this->themePath($active))) {
            return 'default';
        }

        return $active ?: 'default';
    }

    /**
     * Set the active theme slug.
     */
    public function setActiveTheme(string $slug): bool
    {
        $slug = strtolower(trim($slug));

        if ($slug !== 'default' && ! File::exists($this->themePath($slug))) {
            return false;
        }

        Setting::setValue('active_theme', $slug, 'theme');

        return true;
    }

    /**
     * Scan `resources/js/themes/` and discover all installed theme manifests.
     *
     * @return array<string, array<string, mixed>>
     */
    public function discover(): array
    {
        $dir = $this->themePath();
        if (! File::exists($dir)) {
            return [];
        }

        $activeTheme = $this->getActiveTheme();
        $themes = [];
        $folders = File::directories($dir);

        foreach ($folders as $folder) {
            $manifestPath = $folder.'/theme.json';
            $folderName = basename($folder);

            $manifest = [
                'name' => ucfirst($folderName),
                'slug' => $folderName,
                'version' => '1.0.0',
                'author' => 'Developer',
                'description' => 'Custom theme for ScholarGate CMS.',
                'screenshot' => null,
                'supported_slots' => ['after_navbar', 'before_footer', 'home_bento'],
            ];

            if (File::exists($manifestPath)) {
                $json = json_decode(File::get($manifestPath), true);
                if (is_array($json)) {
                    $manifest = array_merge($manifest, $json);
                }
            }

            $manifest['slug'] = $folderName;
            $manifest['is_active'] = ($folderName === $activeTheme);
            $manifest['folder'] = $folder;

            $themes[$folderName] = $manifest;
        }

        // Guarantee 'default' theme is always present even if folder scan missed it
        if (! isset($themes['default'])) {
            $themes['default'] = [
                'name' => 'Bento Grid (Default)',
                'slug' => 'default',
                'version' => '1.0.0',
                'author' => 'ScholarGate Team',
                'description' => 'Clean, modern school portal layout with Bento grid & dark mode.',
                'screenshot' => null,
                'supported_slots' => ['after_navbar', 'before_footer', 'home_bento'],
                'is_active' => ($activeTheme === 'default'),
                'folder' => $this->themePath('default'),
            ];
        }

        return $themes;
    }

    /**
     * Upload and extract theme ZIP.
     */
    public function upload(string $zipPath): array
    {
        if (! class_exists(ZipArchive::class)) {
            return ['ok' => false, 'message' => 'Ekstensi PHP ZipArchive tidak tersedia di server.'];
        }

        $zip = new ZipArchive();
        if ($zip->open($zipPath) !== true) {
            return ['ok' => false, 'message' => 'File ZIP tidak dapat dibuka.'];
        }

        $tempExtractDir = storage_path('app/temp_theme_'.uniqid());
        File::ensureDirectoryExists($tempExtractDir);
        $zip->extractTo($tempExtractDir);
        $zip->close();

        // Find theme.json inside extracted directory
        $manifestPath = null;
        if (File::exists($tempExtractDir.'/theme.json')) {
            $manifestPath = $tempExtractDir.'/theme.json';
        } else {
            $subdirs = File::directories($tempExtractDir);
            if (count($subdirs) === 1 && File::exists($subdirs[0].'/theme.json')) {
                $manifestPath = $subdirs[0].'/theme.json';
            }
        }

        if (! $manifestPath) {
            File::deleteDirectory($tempExtractDir);

            return ['ok' => false, 'message' => 'File theme.json tidak ditemukan di dalam paket ZIP.'];
        }

        $manifestDir = dirname($manifestPath);
        $json = json_decode(File::get($manifestPath), true);
        $slug = preg_replace('/[^a-z0-9_-]/', '', strtolower($json['slug'] ?? basename($manifestDir)));

        if (! $slug || $slug === 'default') {
            File::deleteDirectory($tempExtractDir);

            return ['ok' => false, 'message' => 'Slug tema tidak valid atau tidak boleh menggunakan "default".'];
        }

        $destination = $this->themePath($slug);
        if (File::exists($destination)) {
            File::deleteDirectory($destination);
        }

        File::moveDirectory($manifestDir, $destination);
        File::deleteDirectory($tempExtractDir);

        return [
            'ok' => true,
            'message' => "Tema {$slug} berhasil diunggah.",
            'slug' => $slug,
        ];
    }
}
