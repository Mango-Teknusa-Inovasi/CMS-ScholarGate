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
        $baseUrl = $request->string('openai_base_url')->toString() ?: null;

        $result = $aiService->testConnection($apiKey, $model, $baseUrl);

        return response()->json($result, $result['ok'] ? 200 : 422);
    }

    /**
     * RAG AI Q&A query grounded on published school articles with prompt injection defense.
     */
    public function ask(Request $request, OpenAiArticleService $aiService): JsonResponse
    {
        $request->validate([
            'query' => ['required', 'string', 'max:1000'],
            'max_articles' => ['nullable', 'integer', 'min:1', 'max:10'],
        ], [
            'query.required' => 'Pertanyaan wajib diisi.',
            'query.max' => 'Pertanyaan maksimal 1000 karakter.',
        ]);

        $query = $request->string('query')->toString();
        $maxArticles = $request->integer('max_articles', 4);

        try {
            $result = $aiService->answerRagQuery($query, $maxArticles);

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Terjadi kesalahan saat memproses pertanyaan ke AI.',
            ], 500);
        }
    }

    /**
     * Generate draf artikel berita lengkap dari topik / petunjuk singkat.
     */
    public function fromPrompt(Request $request, OpenAiArticleService $service): JsonResponse
    {
        $request->validate([
            'topic' => ['required', 'string', 'max:500'],
            'key_points' => ['nullable', 'string', 'max:2000'],
            'tone' => ['nullable', 'string', 'in:formal_news,achievement,casual,educational'],
            'category_hint' => ['nullable', 'string', 'max:100'],
        ], [
            'topic.required' => 'Topik atau petunjuk artikel wajib diisi.',
            'topic.max' => 'Topik maksimal 500 karakter.',
        ]);

        try {
            $data = $service->generateArticleFromPrompt([
                'topic' => $request->string('topic')->toString(),
                'key_points' => $request->string('key_points')->toString(),
                'tone' => $request->string('tone', 'formal_news')->toString(),
                'category_hint' => $request->string('category_hint')->toString(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Draf artikel berhasil disusun oleh AI!',
                'data' => $data,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Gagal menyusun artikel AI.',
            ], 500);
        }
    }

    /**
     * Generate naskah sambutan resmi Kepala Sekolah / Pejabat.
     */
    public function welcome(Request $request, OpenAiArticleService $service): JsonResponse
    {
        $request->validate([
            'speaker' => ['nullable', 'string', 'max:200'],
            'theme' => ['required', 'string', 'max:500'],
            'tone' => ['nullable', 'string', 'in:warm_inspirational,visionary,formal_national,religious'],
            'target' => ['nullable', 'string', 'in:home,profile'],
        ], [
            'theme.required' => 'Tema atau poin utama sambutan wajib diisi.',
        ]);

        try {
            $data = $service->generateWelcomeMessage([
                'speaker' => $request->string('speaker', 'Kepala Sekolah')->toString(),
                'theme' => $request->string('theme')->toString(),
                'tone' => $request->string('tone', 'warm_inspirational')->toString(),
                'target' => $request->string('target', 'home')->toString(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Naskah sambutan berhasil disusun oleh AI!',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Gagal menyusun naskah sambutan AI.',
            ], 500);
        }
    }

    /**
     * Generate narasi profil sekolah (Sejarah, Visi Misi, Budaya, Fasilitas).
     */
    public function profile(Request $request, OpenAiArticleService $service): JsonResponse
    {
        $request->validate([
            'tab_label' => ['required', 'string', 'max:100'],
            'hints' => ['nullable', 'string', 'max:2000'],
            'style' => ['nullable', 'string', 'in:history,vision_mission,culture,facilities,general'],
        ], [
            'tab_label.required' => 'Label tab atau nama bagian profil wajib diisi.',
        ]);

        try {
            $data = $service->generateProfileSection([
                'tab_label' => $request->string('tab_label')->toString(),
                'hints' => $request->string('hints')->toString(),
                'style' => $request->string('style', 'general')->toString(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Konten profil sekolah berhasil disusun oleh AI!',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Gagal menyusun konten profil AI.',
            ], 500);
        }
    }

    /**
     * Generate berita liputan prestasi siswa / sekolah.
     */
    public function achievement(Request $request, OpenAiArticleService $service): JsonResponse
    {
        $request->validate([
            'competition' => ['required', 'string', 'max:250'],
            'level' => ['nullable', 'string', 'max:100'],
            'participant' => ['required', 'string', 'max:250'],
            'rank' => ['nullable', 'string', 'max:100'],
            'organizer' => ['nullable', 'string', 'max:200'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ], [
            'competition.required' => 'Nama kejuaraan atau lomba wajib diisi.',
            'participant.required' => 'Nama siswa atau tim peraih prestasi wajib diisi.',
        ]);

        try {
            $data = $service->generateAchievementArticle([
                'competition' => $request->string('competition')->toString(),
                'level' => $request->string('level', 'Nasional')->toString(),
                'participant' => $request->string('participant')->toString(),
                'rank' => $request->string('rank', 'Juara 1')->toString(),
                'organizer' => $request->string('organizer')->toString(),
                'notes' => $request->string('notes')->toString(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Liputan prestasi berhasil disusun oleh AI!',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Gagal menyusun liputan prestasi AI.',
            ], 500);
        }
    }

    /**
     * Asisten teks AI universal untuk RichTextEditor (Draft, Polish PUEBI, Expand, Summarize, Change Tone).
     */
    public function assistText(Request $request, OpenAiArticleService $service): JsonResponse
    {
        $request->validate([
            'action' => ['required', 'string', 'in:draft,polish,expand,summarize,change_tone'],
            'text' => ['nullable', 'string', 'max:10000'],
            'prompt' => ['nullable', 'string', 'max:2000'],
            'tone' => ['nullable', 'string', 'max:100'],
        ], [
            'action.required' => 'Aksi AI wajib dipilih.',
            'action.in' => 'Aksi AI tidak valid.',
        ]);

        try {
            $data = $service->assistText([
                'action' => $request->string('action')->toString(),
                'text' => $request->string('text')->toString(),
                'prompt' => $request->string('prompt')->toString(),
                'tone' => $request->string('tone', 'formal')->toString(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Gagal memproses asisten teks AI.',
            ], 500);
        }
    }
}
