<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
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

        return response()->json($item);
    }

    public function downloads(): JsonResponse
    {
        $items = Download::query()
            ->where('is_active', true)
            ->orderByDesc('published_at')
            ->get();

        return response()->json($items);
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
