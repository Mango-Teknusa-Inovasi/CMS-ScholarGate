<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ArticleAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $trash = $request->boolean('trash');
        $query = $trash
            ? Article::onlyTrashed()->with(['category:id,name', 'tags:id,name,slug'])
            : Article::query()->with(['category:id,name', 'tags:id,name,slug']);

        $query->orderByDesc($trash ? 'deleted_at' : 'updated_at');

        if (! $trash && ($status = $request->string('status')->toString())) {
            $query->where('status', $status);
        }

        if ($search = $request->string('q')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($request->integer('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $tagIds = $this->syncTagIds($request);
        unset($data['tag_ids'], $data['tags']);

        $data['user_id'] = $request->user()->id;
        $data['slug'] = $this->uniqueSlug($data['title'], $data['slug'] ?? null);

        if (($data['status'] ?? 'draft') === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $article = Article::create($data);
        if ($tagIds !== null) {
            $article->tags()->sync($tagIds);
        }

        return response()->json($article->load(['category', 'tags', 'author:id,name']), 201);
    }

    public function show(Article $article): JsonResponse
    {
        return response()->json($article->load(['category', 'tags', 'author:id,name']));
    }

    public function update(Request $request, Article $article): JsonResponse
    {
        $data = $this->validated($request, $article->id);
        $tagIds = $this->syncTagIds($request);
        unset($data['tag_ids'], $data['tags']);

        if (! empty($data['title']) && empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['title'], $article->slug, $article->id);
        } elseif (! empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['title'] ?? $article->title, $data['slug'], $article->id);
        }

        if (($data['status'] ?? $article->status) === 'published' && empty($data['published_at']) && empty($article->published_at)) {
            $data['published_at'] = now();
        }

        $article->update($data);
        if ($tagIds !== null) {
            $article->tags()->sync($tagIds);
        }

        return response()->json($article->fresh()->load(['category', 'tags', 'author:id,name']));
    }

    public function destroy(Article $article): JsonResponse
    {
        $article->delete();

        return response()->json(['message' => 'Artikel dipindah ke sampah']);
    }

    public function restore(int $id): JsonResponse
    {
        $article = Article::onlyTrashed()->findOrFail($id);
        $article->restore();

        return response()->json($article->load(['category', 'tags']));
    }

    public function forceDestroy(int $id): JsonResponse
    {
        $article = Article::onlyTrashed()->findOrFail($id);
        $article->forceDelete();

        return response()->json(['message' => 'Artikel dihapus permanen']);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
            'force' => ['nullable', 'boolean'],
        ]);

        if ($request->boolean('force')) {
            $count = Article::onlyTrashed()->whereIn('id', $data['ids'])->forceDelete();
        } else {
            $count = Article::query()->whereIn('id', $data['ids'])->delete();
        }

        return response()->json(['message' => 'Selesai', 'count' => $count]);
    }

    /**
     * Generate secret preview URL for draft / unpublished article.
     */
    public function previewToken(Article $article): JsonResponse
    {
        $token = $article->issuePreviewToken(14);
        $appUrl = rtrim((string) config('app.url'), '/');
        $path = '/preview/artikel/'.$token;

        return response()->json([
            'token' => $token,
            'expires_at' => $article->preview_token_expires_at?->toIso8601String(),
            'path' => $path,
            'url' => $appUrl.$path,
            'message' => 'Link pratinjau dibuat (berlaku 14 hari). Jangan bagikan ke publik umum.',
        ]);
    }

    private function validated(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'title' => [$id ? 'sometimes' : 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'focus_keyword' => ['nullable', 'string', 'max:120'],
            'canonical_url' => ['nullable', 'string', 'max:500', 'regex:/^(https?:\/\/|\/)/i'],
            'og_image' => ['nullable', 'string', 'max:500'],
            'noindex' => ['nullable', 'boolean'],
            'faq_items' => ['nullable', 'array'],
            'faq_items.*.question' => ['required_with:faq_items', 'string', 'max:500'],
            'faq_items.*.answer' => ['required_with:faq_items', 'string', 'max:5000'],
            'body' => ['nullable', 'string'],
            'cover_path' => ['nullable', 'string'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'status' => ['nullable', 'in:draft,published,archived'],
            'is_featured' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
        ]);
    }

    /**
     * @return list<int>|null null = jangan ubah tags
     */
    private function syncTagIds(Request $request): ?array
    {
        if ($request->has('tag_ids')) {
            return array_values(array_unique(array_map('intval', $request->input('tag_ids', []))));
        }

        if (! $request->has('tags')) {
            return null;
        }

        $names = array_values(array_filter(array_map('trim', $request->input('tags', []))));
        $ids = [];
        foreach ($names as $name) {
            if ($name === '') {
                continue;
            }
            $slug = Str::slug($name) ?: 'tag-'.Str::random(4);
            $tag = Tag::query()->firstOrCreate(
                ['slug' => $slug],
                ['name' => $name]
            );
            $ids[] = $tag->id;
        }

        return $ids;
    }

    private function uniqueSlug(string $title, ?string $slug = null, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug ?: $title) ?: 'artikel';
        $candidate = $base;
        $i = 1;

        while (
            Article::withTrashed()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $candidate = $base.'-'.$i++;
        }

        return $candidate;
    }
}
