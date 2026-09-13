<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Services\ImageOptimizer;
use App\Services\PresignUploadService;
use App\Support\MediaStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

        if ($type = $request->string('type')->toString()) {
            if ($type === 'image') {
                $query->where('mime', 'like', 'image/%');
            } elseif ($type === 'document') {
                $query->where('mime', 'not like', 'image/%');
            }
        }

        return response()->json($query->paginate($request->integer('per_page', 24)));
    }

    /**
     * Path A: file dikirim ke server → kompres lokal (jika gambar) → upload R2.
     * Wajib untuk JPG/PNG/GIF/WebP raster.
     */
    public function store(Request $request, ImageOptimizer $optimizer): JsonResponse
    {
        $request->validate([
            // SVG dilarang (XSS vector jika di-serve inline)
            'file' => [
                'required',
                'file',
                'max:51200',
                'mimes:jpg,jpeg,png,gif,webp,bmp,pdf,doc,docx,xls,xlsx,ppt,pptx,zip,rar,txt,csv,odt,ods,odp',
            ],
            'alt' => ['nullable', 'string', 'max:255'],
            'max_width' => ['nullable', 'integer', 'min:400', 'max:3840'],
            // force=optimize|auto (default auto: compress images, raw otherwise)
            'force' => ['nullable', 'string', 'in:optimize,auto'],
        ]);

        $file = $request->file('file');
        $mime = (string) $file->getMimeType();
        $originalName = $file->getClientOriginalName();

        // Non-kompres: sarankan presign, tapi tetap izinkan server path (fallback)
        if (
            $request->string('force')->toString() !== 'optimize'
            && ! ImageOptimizer::needsAppCompression($mime)
        ) {
            // tetap process via local temp → R2 raw
        }

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
            'disk' => $result['disk'] ?? MediaStorage::diskName(),
            'mime' => $result['mime'],
            'size' => $result['size'],
            'alt' => $request->string('alt')->toString() ?: pathinfo($originalName, PATHINFO_FILENAME),
            'width' => $result['width'],
            'height' => $result['height'],
            'optimized' => $result['optimized'],
        ]);

        return response()->json([
            ...$media->toArray(),
            'mode' => $result['mode'] ?? 'local_then_r2',
            'url' => $media->url,
        ], 201);
    }

    /**
     * Path B: minta presigned PUT URL (file tanpa kompres app) — client → R2 langsung.
     */
    public function presign(Request $request, PresignUploadService $presign): JsonResponse
    {
        $data = $request->validate([
            'filename' => ['required', 'string', 'max:255'],
            'content_type' => ['required', 'string', 'max:120'],
            'size' => ['nullable', 'integer', 'min:1', 'max:26214400'], // 25MB
            'alt' => ['nullable', 'string', 'max:255'],
        ]);

        $mime = strtolower($data['content_type']);
        $ext = strtolower(pathinfo($data['filename'], PATHINFO_EXTENSION));

        // Tolak SVG & tipe berbahaya
        if (
            str_contains($mime, 'svg')
            || in_array($ext, ['svg', 'svgz', 'html', 'htm', 'js', 'php', 'exe'], true)
        ) {
            return response()->json(['message' => 'Tipe file tidak diizinkan (keamanan).'], 422);
        }

        // Tolak raster yang seharusnya dikompres app
        if (ImageOptimizer::needsAppCompression($mime)) {
            return response()->json([
                'message' => 'Gambar raster harus lewat optimasi server (kompres lokal → R2), bukan presign.',
                'use' => 'POST /admin/media-library (multipart, optimize)',
                'needs_compression' => true,
            ], 422);
        }

        $payload = $presign->create(
            $data['filename'],
            $data['content_type'],
            'uploads',
            15
        );

        return response()->json([
            ...$payload,
            'alt' => $data['alt'] ?? pathinfo($data['filename'], PATHINFO_FILENAME),
            'needs_compression' => false,
        ]);
    }

    /**
     * Setelah client PUT ke R2 sukses, daftarkan ke media library.
     */
    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate([
            'path' => ['required', 'string', 'max:500'],
            'filename' => ['nullable', 'string', 'max:255'],
            'original_filename' => ['nullable', 'string', 'max:255'],
            'mime' => ['required', 'string', 'max:120'],
            'size' => ['nullable', 'integer', 'min:0'],
            'alt' => ['nullable', 'string', 'max:255'],
            'width' => ['nullable', 'integer', 'min:0'],
            'height' => ['nullable', 'integer', 'min:0'],
            'disk' => ['nullable', 'string', 'max:32'],
        ]);

        // Never trust client-supplied disk — always use application media disk
        $disk = MediaStorage::diskName();
        $path = ltrim($data['path'], '/');

        // Path traversal & prefix must stay under uploads/
        if (
            $path === ''
            || str_contains($path, '..')
            || str_contains($path, "\0")
            || ! preg_match('#^uploads/[A-Za-z0-9_./-]+$#', $path)
        ) {
            return response()->json([
                'message' => 'Invalid media path. Must be under uploads/.',
            ], 422);
        }

        $mime = strtolower($data['mime']);
        if (
            str_contains($mime, 'svg')
            || str_contains($mime, 'html')
            || str_contains($mime, 'javascript')
            || str_contains($mime, 'xml')
        ) {
            return response()->json(['message' => 'MIME type not allowed.'], 422);
        }

        // Object must exist on the configured disk before library registration
        $key = in_array($disk, ['r2', 's3'], true)
            ? MediaStorage::prefixPath($path)
            : $path;

        if (! Storage::disk($disk)->exists($key)) {
            return response()->json([
                'message' => 'File not found in object storage. Complete the presigned upload first.',
            ], 422);
        }

        $size = $data['size'] ?? (int) Storage::disk($disk)->size($key);

        $media = Media::create([
            'user_id' => $request->user()?->id,
            'path' => $path,
            'filename' => $data['filename'] ?? basename($path),
            'original_filename' => $data['original_filename'] ?? ($data['filename'] ?? basename($path)),
            'disk' => $disk,
            'mime' => $data['mime'],
            'size' => $size,
            'alt' => $data['alt'] ?? pathinfo($data['original_filename'] ?? $path, PATHINFO_FILENAME),
            'width' => $data['width'] ?? null,
            'height' => $data['height'] ?? null,
            'optimized' => false,
        ]);

        return response()->json([
            ...$media->toArray(),
            'mode' => 'presign',
            'url' => $media->url,
        ], 201);
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
            'ids.*' => ['string', 'exists:media,id'],
        ]);

        $items = Media::query()->whereIn('id', $data['ids'])->get();
        foreach ($items as $item) {
            $item->deleteFile();
            $item->delete();
        }

        return response()->json(['message' => 'Media terhapus', 'count' => $items->count()]);
    }
}
