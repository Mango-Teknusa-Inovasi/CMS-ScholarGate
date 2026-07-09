<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\Extracurricular;
use App\Models\Banner;
use App\Models\Category;
use App\Models\ContactInfo;
use App\Models\Download;
use App\Models\GalleryItem;
use App\Models\Partner;
use App\Models\ProfilePage;
use App\Models\QuickService;
use App\Models\ServiceItem;
use App\Models\Setting;
use App\Models\MenuItem;
use App\Models\WelcomeBlock;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ResourceAdminController extends Controller
{
    private array $map = [
        'banners' => Banner::class,
        'categories' => Category::class,
        'services' => ServiceItem::class,
        'achievements' => Achievement::class,
        'gallery' => GalleryItem::class,
        'partners' => Partner::class,
        'contacts' => ContactInfo::class,
        'quick-services' => QuickService::class,
        'ekstrakurikuler' => Extracurricular::class,
        'downloads' => Download::class,
        'welcome-blocks' => WelcomeBlock::class,
        'menus' => MenuItem::class,
    ];

    public function index(string $resource): JsonResponse
    {
        $model = $this->model($resource);
        $items = $model::query()->orderBy('id')->get();

        return response()->json($items);
    }

    public function store(Request $request, string $resource): JsonResponse
    {
        $model = $this->model($resource);
        $data = $this->normalize($request->all());
        $this->prepareSlug($resource, $data);
        $item = $model::create($data);

        return response()->json($item, 201);
    }

    public function update(Request $request, string $resource, int $id): JsonResponse
    {
        $model = $this->model($resource);
        /** @var Model $item */
        $item = $model::query()->findOrFail($id);
        $data = $this->normalize($request->all());
        $this->prepareSlug($resource, $data, $id);
        $item->update($data);

        return response()->json($item->fresh());
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data): array
    {
        foreach ($data as $key => $value) {
            if ($value === '' || $value === 'null') {
                $data[$key] = null;
            }
            if (in_array($key, ['is_active', 'is_featured', 'open_in_new_tab'], true)) {
                $data[$key] = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            }
            if (in_array($key, ['sort_order', 'parent_id', 'download_count'], true) && $data[$key] !== null) {
                $data[$key] = (int) $data[$key];
            }
        }

        return $data;
    }

    public function destroy(string $resource, int $id): JsonResponse
    {
        $model = $this->model($resource);
        $item = $model::query()->findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function settings(): JsonResponse
    {
        return response()->json(Setting::allAsArray());
    }

    public function updateSettings(Request $request): JsonResponse
    {
        foreach ($request->all() as $key => $value) {
            if (is_array($value)) {
                $value = json_encode($value);
            }
            Setting::setValue($key, is_bool($value) ? ($value ? '1' : '0') : (string) $value);
        }

        return response()->json(Setting::allAsArray());
    }

    public function profilePage(): JsonResponse
    {
        return response()->json(ProfilePage::query()->first());
    }

    public function updateProfilePage(Request $request): JsonResponse
    {
        $page = ProfilePage::query()->first() ?? new ProfilePage;
        $page->fill($request->only(['title', 'subtitle', 'tabs']));
        $page->save();

        return response()->json($page);
    }

    public function upload(Request $request, \App\Services\ImageOptimizer $optimizer): JsonResponse
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

        $media = \App\Models\Media::create([
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

        return response()->json([
            'path' => $result['path'],
            'url' => asset('storage/'.$result['path']),
            'media' => $media,
            'optimized' => $result['optimized'],
        ]);
    }

    private function model(string $resource): string
    {
        abort_unless(isset($this->map[$resource]), 404, 'Resource not found');

        return $this->map[$resource];
    }

    private function prepareSlug(string $resource, array &$data, ?int $ignoreId = null): void
    {
        if (! in_array($resource, ['categories', 'achievements'], true)) {
            return;
        }

        if (empty($data['title'] ?? $data['name'] ?? null) && empty($data['slug'] ?? null)) {
            return;
        }

        $source = $data['slug'] ?? $data['title'] ?? $data['name'] ?? 'item';
        $base = Str::slug($source) ?: 'item';
        $candidate = $base;
        $i = 1;
        $model = $this->model($resource);

        while (
            $model::query()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $candidate = $base.'-'.$i++;
        }

        $data['slug'] = $candidate;
    }
}
