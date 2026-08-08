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

        $pluginSlug = $manifest['slug'];
        $targetDir = $this->pluginManager->pluginPath($pluginSlug);

        // Extract zip to plugin folder
        $zip->extractTo($targetDir);
        $zip->close();

        return response()->json([
            'slug' => $pluginSlug,
            'message' => "Plugin {$manifest['name']} ({$pluginSlug}) berhasil diunggah.",
        ]);
    }
}
