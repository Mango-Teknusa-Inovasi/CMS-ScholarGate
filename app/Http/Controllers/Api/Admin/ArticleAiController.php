<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\InstagramArticleImportService;
use App\Services\OpenAiArticleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticleAiController extends Controller
{
    /**
     * Generate draf artikel berita dari tautan postingan Instagram.
     */
    public function fromInstagram(Request $request, InstagramArticleImportService $service): JsonResponse
    {
        $request->validate([
            'url' => ['required', 'string', 'url'],
            'tone' => ['nullable', 'string', 'in:formal_news,casual,achievement'],
            'manual_caption' => ['nullable', 'string', 'max:5000'],
        ], [
            'url.required' => 'Tautan postingan Instagram wajib diisi.',
            'url.url' => 'Format tautan Instagram tidak valid.',
        ]);

        $url = $request->string('url')->toString();
        if (! str_contains($url, 'instagram.com')) {
            return response()->json([
                'message' => 'Tautan harus berasal dari instagram.com (contoh: https://www.instagram.com/p/...).',
            ], 422);
        }

        try {
            $data = $service->importFromInstagram(
                $url,
                [
                    'tone' => $request->string('tone', 'formal_news')->toString(),
                    'manual_caption' => $request->string('manual_caption')->toString(),
                ],
                $request->user()?->id
            );

            return response()->json([
                'success' => true,
                'message' => 'Artikel berhasil dibuat dari Instagram!',
                'data' => $data,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Terjadi kesalahan saat memproses data Instagram.',
            ], 500);
        }
    }

    /**
     * Uji koneksi API OpenAI dari pengaturan.
     */
    public function testConnection(Request $request, OpenAiArticleService $aiService): JsonResponse
    {
        $apiKey = $request->string('openai_api_key')->toString() ?: null;
        $model = $request->string('openai_model')->toString() ?: null;

        $result = $aiService->testConnection($apiKey, $model);

        return response()->json($result, $result['ok'] ? 200 : 422);
    }
}
