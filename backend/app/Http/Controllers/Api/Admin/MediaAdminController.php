<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Services\ImageOptimizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Media::query()->with('user:id,name')->orderByDesc('id');

        if ($q = $request->string('q')->toString()) {
            $query->where(function ($builder) use ($q) {
                $builder->where('filename', 'like', "%{$q}%")
                    ->orWhere('original_filename', 'like', "%{$q}%")
                    ->orWhere('alt', 'like', "%{$q}%");
            });
        }

        return response()->json($query->paginate($request->integer('per_page', 24)));
    }

    public function store(Request $request, ImageOptimizer $optimizer): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:12288', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,svg'],
            'alt' => ['nullable', 'string', 'max:255'],
            'max_width' => ['nullable', 'integer', 'min:400', 'max:3840'],
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $result = $optimizer->store(
            $file,
            'uploads',
            $request->integer('max_width', 1920),
            82
        );

        $media = Media::create([
            'user_id' => $request->user()?->id,
            'path' => $result['path'],
            'filename' => $result['filename'],
            'original_filename' => $originalName,
            'disk' => 'public',
            'mime' => $result['mime'],
            'size' => $result['size'],
            'alt' => $request->string('alt')->toString() ?: pathinfo($originalName, PATHINFO_FILENAME),
            'width' => $result['width'],
            'height' => $result['height'],
            'optimized' => $result['optimized'],
        ]);

        return response()->json($media, 201);
    }

    public function update(Request $request, Media $medium): JsonResponse
    {
        $data = $request->validate([
            'alt' => ['nullable', 'string', 'max:255'],
            'filename' => ['nullable', 'string', 'max:255'],
        ]);
        $medium->update($data);

        return response()->json($medium->fresh());
    }

    public function destroy(Media $medium): JsonResponse
    {
        $medium->deleteFile();
        $medium->delete();

        return response()->json(['message' => 'Media dihapus']);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:media,id'],
        ]);

        $items = Media::query()->whereIn('id', $data['ids'])->get();
        foreach ($items as $item) {
            $item->deleteFile();
            $item->delete();
        }

        return response()->json(['message' => 'Media terhapus', 'count' => $items->count()]);
    }
}
