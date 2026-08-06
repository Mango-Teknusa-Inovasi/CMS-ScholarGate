<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\LegalPage;
use App\Support\LegalContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LegalPageAdminController extends Controller
{
    public function index(): JsonResponse
    {
        $pages = LegalPage::query()->orderBy('key')->get();

        return response()->json([
            'pages' => $pages,
            'institution' => LegalContent::institutionName(),
        ]);
    }

    public function show(string $key): JsonResponse
    {
        if (! in_array($key, LegalPage::KEYS, true)) {
            return response()->json(['message' => 'Key tidak valid.'], 404);
        }

        $page = LegalPage::findByKey($key);
        if (! $page) {
            return response()->json(['message' => 'Belum ada data. Jalankan seeder atau reset default.'], 404);
        }

        return response()->json($page);
    }

    public function update(Request $request, string $key): JsonResponse
    {
        if (! in_array($key, LegalPage::KEYS, true)) {
            return response()->json(['message' => 'Key tidak valid.'], 404);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:200000'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $page = LegalPage::query()->updateOrCreate(
            ['key' => $key],
            [
                'title' => $data['title'],
                'body' => $data['body'] ?? '',
                'is_published' => $request->boolean('is_published', true),
            ]
        );

        return response()->json($page->fresh());
    }

    /**
     * Reset one or all legal pages to dynamic defaults using current site_name.
     */
    public function resetDefaults(Request $request): JsonResponse
    {
        $data = $request->validate([
            'key' => ['nullable', 'in:privacy,terms'],
        ]);

        $org = LegalContent::institutionName();
        $defaults = LegalContent::allDefaults($org);
        $updated = [];

        foreach ($defaults as $row) {
            if (! empty($data['key']) && $row['key'] !== $data['key']) {
                continue;
            }
            $updated[] = LegalPage::query()->updateOrCreate(
                ['key' => $row['key']],
                [
                    'title' => $row['title'],
                    'body' => $row['body'],
                    'is_published' => true,
                ]
            )->fresh();
        }

        return response()->json([
            'message' => 'Konten default diperbarui dengan nama lembaga: '.$org,
            'institution' => $org,
            'pages' => $updated,
        ]);
    }
}
