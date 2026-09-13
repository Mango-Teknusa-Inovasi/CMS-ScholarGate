<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\Article;
use App\Models\Extracurricular;
use App\Models\MenuItem;
use App\Models\Category;
use App\Models\Download;
use App\Models\Setting;
use App\Support\PublicSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicDataController extends Controller
{
    public function settings(): JsonResponse
    {
        return response()->json(PublicSettings::filterPublic(Setting::allAsArray()));
    }

    public function menus(): JsonResponse
    {
        $items = MenuItem::query()
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with(['children' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get()
            ->groupBy('location');

        return response()->json([
            'header' => $items->get('header', collect())->values(),
            'footer' => $items->get('footer', collect())->values(),
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = Category::query()
            ->withCount(['articles' => fn ($q) => $q->published()])
            ->orderBy('sort_order')
            ->get();

        return response()->json($categories);
    }

    public function achievements(Request $request): JsonResponse
    {
        $items = Achievement::published()
            ->orderByDesc('is_featured')
            ->orderByDesc('achieved_at')
            ->paginate($request->integer('per_page', 12));

        return response()->json($items);
    }

    public function achievementShow(string $slug): JsonResponse
    {
        $item = Achievement::published()->where('slug', $slug)->firstOrFail();

        $otherAchievements = Achievement::published()
            ->where('id', '!=', $item->id)
            ->orderByDesc('is_featured')
            ->orderByDesc('achieved_at')
            ->limit(5)
            ->get();

        $recentArticles = Article::published()
            ->with('category:id,name,slug,color')
            ->orderByDesc('published_at')
            ->limit(5)
            ->get();

        return response()->json([
            ...$item->toArray(),
            'other_achievements' => $otherAchievements,
            'recent_articles' => $recentArticles,
        ]);
    }

    public function downloads(): JsonResponse
    {
        $items = Download::query()
            ->where('is_active', true)
            ->orderByDesc('published_at')
            ->get();

        return response()->json($items);
    }

    public function hitDownload(string $id): JsonResponse
    {
        $download = Download::query()->where('is_active', true)->findOrFail($id);
        $download->increment('download_count');

        return response()->json([
            'success' => true,
            'download_count' => $download->download_count,
        ]);
    }

    public function extracurriculars(): JsonResponse
    {
        $items = Extracurricular::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json($items);
    }
}
