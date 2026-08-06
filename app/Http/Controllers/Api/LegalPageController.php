<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegalPage;
use Illuminate\Http\JsonResponse;

class LegalPageController extends Controller
{
    public function show(string $key): JsonResponse
    {
        if (! in_array($key, LegalPage::KEYS, true)) {
            return response()->json(['message' => 'Halaman tidak ditemukan.'], 404);
        }

        $page = LegalPage::findByKey($key);
        if (! $page || ! $page->is_published) {
            return response()->json(['message' => 'Halaman tidak tersedia.'], 404);
        }

        return response()->json([
            'key' => $page->key,
            'title' => $page->title,
            'body' => $page->body,
            'path' => $page->publicPath(),
            'updated_at' => $page->updated_at?->toIso8601String(),
        ]);
    }
}
