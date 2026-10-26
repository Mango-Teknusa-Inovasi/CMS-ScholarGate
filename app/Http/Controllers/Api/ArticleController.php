<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Category;
use App\Services\ResponsiveMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ArticleController extends Controller
{
    public function index(Request $request, ResponsiveMedia $responsiveMedia): JsonResponse
    {
        $query = Article::published()->with(['category:id,name,slug,color', 'tags:id,name,slug']);

        if ($search = $request->string('q')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        if ($category = $request->string('category')->toString()) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $category));
        }

        $sort = $request->string('sort', 'latest')->toString();
        match ($sort) {
            'popular' => $query->orderByDesc('views'),
            'oldest' => $query->orderBy('published_at'),
            default => $query->orderByDesc('published_at'),
        };

        $featured = null;
        if (! $request->boolean('skip_featured')) {
            $featured = (clone $query)->where('is_featured', true)->first();
        }

        $articles = $query->paginate($request->integer('per_page', 10));
        $responsiveMedia->attach($articles->getCollection(), 'cover_path', 'cover_srcset');
        if ($featured) $responsiveMedia->attach(collect([$featured]), 'cover_path', 'cover_srcset');

        $categories = Category::query()
            ->withCount(['articles' => fn ($q) => $q->published()])
            ->orderBy('sort_order')
            ->get();

        $popular = Article::published()
            ->with('category:id,name,slug,color')
            ->orderByDesc('views')
            ->limit(5)
            ->get();
        $responsiveMedia->attach($popular, 'cover_path', 'cover_srcset');

        return response()->json([
            'featured' => $featured,
            'articles' => $articles,
            'sidebar' => [
                'summary' => [
                    'total_articles' => Article::published()->count(),
                    'total_categories' => $categories->count(),
                ],
                'categories' => $categories,
                'popular' => $popular,
            ],
        ]);
    }

    /**
     * Pratinjau draf lewat secret token (noindex, tidak naikkan views).
     */
    public function preview(string $token, ResponsiveMedia $responsiveMedia): JsonResponse
    {
        $article = Article::query()
            ->with(['category:id,name,slug,color', 'tags:id,name,slug', 'author:id,name'])
            ->where('preview_token', $token)
            ->firstOrFail();

        if (! $article->isPreviewTokenValid($token)) {
            abort(410, 'Link pratinjau kedaluwarsa atau tidak valid.');
        }

        $responsiveMedia->attach(collect([$article]), 'cover_path', 'cover_srcset');

        return response()->json([
            'article' => $article,
            'preview' => true,
            'related' => [],
            'sidebar' => [
                'categories' => [],
                'popular' => [],
            ],
        ]);
    }

    public function show(Request $request, string $slug, ResponsiveMedia $responsiveMedia): JsonResponse
    {
        $article = Article::published()
            ->with(['category:id,name,slug,color', 'tags:id,name,slug', 'author:id,name'])
            ->where('slug', $slug)
            ->firstOrFail();

        // Anti view-inflate: max 1 hit per IP per artikel per jam
        $viewKey = 'article_view:'.$article->id.':'.$request->ip();
        if (Cache::add($viewKey, 1, now()->addHour())) {
            $article->increment('views');
        }

        $related = Article::published()
            ->with('category:id,name,slug,color')
            ->where('id', '!=', $article->id)
            ->when($article->category_id, fn ($q) => $q->where('category_id', $article->category_id))
            ->orderByDesc('published_at')
            ->limit(4)
            ->get();

        $popular = Article::published()
            ->with('category:id,name,slug,color')
            ->where('id', '!=', $article->id)
            ->orderByDesc('views')
            ->limit(5)
            ->get();

        $categories = Category::query()
            ->withCount(['articles' => fn ($q) => $q->published()])
            ->orderBy('sort_order')
            ->get();

        $article = $article->fresh(['category:id,name,slug,color', 'tags:id,name,slug', 'author:id,name']);
        $responsiveMedia->attach(collect([$article]), 'cover_path', 'cover_srcset');
        $responsiveMedia->attach($related, 'cover_path', 'cover_srcset');
        $responsiveMedia->attach($popular, 'cover_path', 'cover_srcset');

        return response()->json([
            'article' => $article,
            'related' => $related,
            'sidebar' => [
                'categories' => $categories,
                'popular' => $popular,
            ],
        ]);
    }
}
