<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Theme\ThemeManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ThemeAdminController extends Controller
{
    public function __construct(
        protected ThemeManager $themeManager
    ) {}

    /**
     * List all installed themes and active theme status.
     */
    public function index(): JsonResponse
    {
        $themes = array_values($this->themeManager->discover());
        $activeTheme = $this->themeManager->getActiveTheme();

        return response()->json([
            'ok' => true,
            'active_theme' => $activeTheme,
            'data' => $themes,
        ]);
    }

    /**
     * Activate a theme by slug.
     */
    public function activate(string $slug): JsonResponse
    {
        $success = $this->themeManager->setActiveTheme($slug);

        if (! $success) {
            return response()->json([
                'ok' => false,
                'message' => "Tema '{$slug}' tidak ditemukan.",
            ], 404);
        }

        return response()->json([
            'ok' => true,
            'message' => "Tema '{$slug}' berhasil diaktifkan.",
            'active_theme' => $slug,
        ]);
    }

    /**
     * Upload a new theme ZIP package.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:zip', 'max:51200'], // max 50MB
        ]);

        $file = $request->file('file');
        $result = $this->themeManager->upload($file->getRealPath());

        if (! $result['ok']) {
            return response()->json([
                'ok' => false,
                'message' => $result['message'],
            ], 422);
        }

        return response()->json([
            'ok' => true,
            'message' => $result['message'],
            'slug' => $result['slug'],
        ]);
    }
}
