<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\Article;
use App\Models\Banner;
use App\Models\GalleryItem;
use App\Models\Partner;
use App\Models\ServiceItem;
use App\Models\Setting;
use App\Models\WelcomeBlock;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $featuredArticles = Article::published()
            ->with('category:id,name,slug,color')
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at')
            ->limit(5)
            ->get();

        $achievements = Achievement::published()
            ->orderByDesc('is_featured')
            ->orderByDesc('achieved_at')
            ->limit(4)
            ->get();

        return response()->json([
            'settings' => Setting::allAsArray(),
            'banners' => Banner::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'welcome' => WelcomeBlock::query()->where('key', 'home')->where('is_active', true)->first(),
            'services' => ServiceItem::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'articles' => $featuredArticles,
            'achievements' => $achievements,
            'gallery' => GalleryItem::query()->where('is_active', true)->orderBy('sort_order')->limit(9)->get(),
            'partners' => Partner::query()->where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }
}
