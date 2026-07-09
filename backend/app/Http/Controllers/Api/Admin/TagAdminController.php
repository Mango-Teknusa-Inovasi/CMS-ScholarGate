<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TagAdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Tag::query()->withCount('articles')->orderBy('name')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:120'],
        ]);
        $data['slug'] = $this->uniqueSlug($data['name'], $data['slug'] ?? null);
        $tag = Tag::create($data);

        return response()->json($tag, 201);
    }

    public function update(Request $request, Tag $tag): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:120'],
        ]);
        if (! empty($data['name']) && empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['name'], $tag->slug, $tag->id);
        } elseif (! empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['name'] ?? $tag->name, $data['slug'], $tag->id);
        }
        $tag->update($data);

        return response()->json($tag->fresh());
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $tag->delete();

        return response()->json(['message' => 'Tag dihapus']);
    }

    private function uniqueSlug(string $name, ?string $slug = null, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug ?: $name) ?: 'tag';
        $candidate = $base;
        $i = 1;
        while (
            Tag::query()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $candidate = $base.'-'.$i++;
        }

        return $candidate;
    }
}
