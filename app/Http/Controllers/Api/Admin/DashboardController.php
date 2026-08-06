<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Banner;
use App\Models\Category;
use App\Models\Download;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'stats' => [
                'articles_published' => Article::published()->count(),
                'articles_draft' => Article::query()->where('status', 'draft')->count(),
                'categories' => Category::query()->count(),
                'banners_active' => Banner::query()->where('is_active', true)->count(),
                'downloads' => Download::query()->where('is_active', true)->count(),
                'total_views' => (int) Article::query()->sum('views'),
            ],
            'recent_articles' => Article::query()
                ->with('category:id,name')
                ->orderByDesc('updated_at')
                ->limit(5)
                ->get(['id', 'title', 'slug', 'status', 'views', 'category_id', 'updated_at']),
        ]);
    }
}
