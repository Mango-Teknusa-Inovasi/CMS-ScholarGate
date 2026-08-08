<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Plugin\PluginManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ZipArchive;

class PluginAdminController extends Controller
{
    public function __construct(private PluginManager $pluginManager) {}

    public function index(): JsonResponse
    {
        $discovered = $this->pluginManager->discover();

        return response()->json([
            'plugins' => array_values($discovered),
        ]);
    }

    public function toggle(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'active' => ['required', 'boolean'],
        ]);

        $isActive = $this->pluginManager->toggle($slug, (bool) $request->input('active'));

        return response()->json([
            'slug' => $slug,
            'is_active' => $isActive,
            'message' => $isActive ? "Plugin {$slug} berhasil diaktifkan." : "Plugin {$slug} dinonaktifkan.",
        ]);
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:zip', 'max:20480'], // max 20MB
        ]);

        if (! class_exists(ZipArchive::class)) {
            return response()->json(['message' => 'Ekstensi ZipArchive PHP belum diaktifkan di server.'], 422);
        }

        $file = $request->file('file');
        $zip = new ZipArchive;
        if ($zip->open($file->getRealPath()) !== true) {
            return response()->json(['message' => 'Gagal membuka file ZIP plugin.'], 422);
        }

        // Locate plugin.json inside zip
        $manifestContent = null;
        $pluginSlug = null;

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entry = $zip->getNameIndex($i);
            if (basename($entry) === 'plugin.json') {
                $manifestContent = $zip->getFromIndex($i);
                break;
            }
        }

        if (! $manifestContent) {
            $zip->close();

            return response()->json(['message' => 'File ZIP tidak valid: plugin.json tidak ditemukan.'], 422);
        }

        $manifest = json_decode($manifestContent, true);
        if (! is_array($manifest) || empty($manifest['slug'])) {
            $zip->close();

            return response()->json(['message' => 'File plugin.json tidak memiliki field slug yang valid.'], 422);
        }

        $pluginSlug = strtolower(trim((string) $manifest['slug']));
        if (! preg_match('/^[a-z0-9-]+$/', $pluginSlug)) {
            $zip->close();

            return response()->json(['message' => 'Slug plugin hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).'], 422);
        }

        $basePluginsDir = $this->pluginManager->pluginPath();
        \Illuminate\Support\Facades\File::ensureDirectoryExists($basePluginsDir);
        $realBaseDir = realpath($basePluginsDir) ?: $basePluginsDir;
        $targetDir = $realBaseDir.'/'.$pluginSlug;

        // Security Audit Zip Archive Entries (Zip Slip & Malware Protection)
        $maxFiles = 500;
        $maxTotalSize = 50 * 1024 * 1024; // 50MB max uncompressed
        $totalSize = 0;
        $forbiddenNames = ['.env', '.htaccess', 'web.config', '.phar', '.phtml', '.php5'];

        if ($zip->numFiles > $maxFiles) {
            $zip->close();

            return response()->json(['message' => 'File ZIP berisi terlalu banyak file (maksimal 500 file).'], 422);
        }

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            if (! $stat) {
                continue;
            }

            $filename = $stat['name'];
            $totalSize += $stat['size'];

            if ($totalSize > $maxTotalSize) {
                $zip->close();

                return response()->json(['message' => 'Total ukuran file ZIP melebihi batas aman (maksimal 50MB).'], 422);
            }

            // Check Zip Slip path traversal (../ or \ or leading /)
            if (str_contains($filename, '..') || str_contains($filename, '\\') || str_starts_with($filename, '/')) {
                $zip->close();

                return response()->json(['message' => 'File ZIP ditolak karena terdeteksi percobaan Path Traversal (Zip Slip).'], 422);
            }

            // Check forbidden sensitive files (.env, .htaccess, etc)
            $baseName = strtolower(basename($filename));
            if (in_array($baseName, $forbiddenNames, true)) {
                $zip->close();

                return response()->json(['message' => "File ZIP ditolak karena berisi file terlarang ({$baseName})."], 422);
            }
        }

        // Safe extraction to isolated plugin directory
        \Illuminate\Support\Facades\File::ensureDirectoryExists($targetDir);
        $zip->extractTo($targetDir);
        $zip->close();

        return response()->json([
            'slug' => $pluginSlug,
            'message' => "Plugin {$manifest['name']} ({$pluginSlug}) berhasil diverifikasi & diunggah secara aman.",
        ]);
    }

}
