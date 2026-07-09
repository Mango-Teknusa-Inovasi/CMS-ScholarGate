<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index(Request $request): JsonResponse
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

        $categories = Category::query()
            ->withCount(['articles' => fn ($q) => $q->published()])
            ->orderBy('sort_order')
            ->get();

        $popular = Article::published()
            ->with('category:id,name,slug,color')
            ->orderByDesc('views')
            ->limit(5)
            ->get();

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

    public function show(string $slug): JsonResponse
    {
        $article = Article::published()
            ->with(['category:id,name,slug,color', 'tags:id,name,slug', 'author:id,name'])
            ->where('slug', $slug)
            ->firstOrFail();

        $article->increment('views');

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

        return response()->json([
            'article' => $article->fresh([
                'category:id,name,slug,color',
                'tags:id,name,slug',
                'author:id,name',
            ]),
            'related' => $related,
            'sidebar' => [
                'categories' => $categories,
                'popular' => $popular,
            ],
        ]);
    }
}
