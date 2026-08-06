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
use App\Services\BrandLogoService;
use App\Services\SeoService;
use App\Support\PublicSettings;
use App\Support\SafeUrl;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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
        $data = $this->onlyFillable($model, $data);
        $this->assertSafeUrls($data);
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
        $data = $this->onlyFillable($model, $data);
        $this->assertSafeUrls($data);
        $this->prepareSlug($resource, $data, $id);
        $item->update($data);

        return response()->json($item->fresh());
    }

    /**
     * Restrict mass assignment to the model fillable attributes only.
     *
     * @param  class-string<Model>  $model
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function onlyFillable(string $model, array $data): array
    {
        /** @var Model $instance */
        $instance = new $model;
        $fillable = $instance->getFillable();
        if ($fillable === []) {
            return $data;
        }

        return array_intersect_key($data, array_flip($fillable));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data): array
    {
        // Jangan izinkan field meta mass-assignment
        unset($data['id'], $data['created_at'], $data['updated_at'], $data['deleted_at']);

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
            // URL fields (bukan file_path storage) — strip javascript: dll.
            if (in_array($key, ['url', 'cta_url', 'link_url'], true) && is_string($data[$key] ?? null)) {
                $data[$key] = SafeUrl::normalize($data[$key]);
            }
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function assertSafeUrls(array $data): void
    {
        foreach (['url', 'cta_url', 'link_url'] as $key) {
            if (! array_key_exists($key, $data) || $data[$key] === null || $data[$key] === '') {
                continue;
            }
            if (! is_string($data[$key]) || ! SafeUrl::isAllowed($data[$key])) {
                abort(422, "Field {$key} berisi URL tidak aman.");
            }
        }
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
        return response()->json(PublicSettings::filterPublic(Setting::allAsArray()));
    }

    public function updateSettings(Request $request): JsonResponse
    {
        foreach ($request->all() as $key => $value) {
            if (! is_string($key) || ! PublicSettings::isAllowed($key)) {
                continue;
            }
            if (is_array($value)) {
                $value = json_encode($value);
            }
            // URL-like settings
            if (in_array($key, ['report_url'], true) && is_string($value) && $value !== '') {
                $value = SafeUrl::normalize($value) ?? '';
            }
            // GSC / Bing: izinkan tempel full <meta ... content="...">
            if (in_array($key, ['google_site_verification', 'bing_site_verification'], true)) {
                $value = SeoService::normalizeVerificationCode(is_string($value) ? $value : (string) $value);
            }
            Setting::setValue($key, is_bool($value) ? ($value ? '1' : '0') : (string) $value);
        }

        return response()->json(PublicSettings::filterPublic(Setting::allAsArray()));
    }

    /**
     * Unggah logo → auto generate favicon 16/32, apple-touch, logo WebP, OG fallback.
     */
    public function uploadBrandLogo(Request $request, BrandLogoService $brand): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:4096', 'mimes:jpg,jpeg,png,gif,webp,bmp'],
            'alt' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $result = $brand->processUpload(
                $request->file('file'),
                $request->user()?->id,
                $request->string('alt')->toString() ?: null
            );
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages(['file' => [$e->getMessage()]]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Gagal memproses logo. Pastikan file gambar valid.',
            ], 422);
        }

        return response()->json([
            'message' => 'Logo diproses: favicon, apple-touch icon, dan aset brand disimpan.',
            'settings' => $result['settings'],
            'paths' => $result['paths'],
            'urls' => $result['urls'],
        ], 201);
    }

    /**
     * Hapus logo + favicon turunan.
     */
    public function clearBrandLogo(BrandLogoService $brand): JsonResponse
    {
        $settings = $brand->clearBrandAssets(true);

        return response()->json([
            'message' => 'Logo & favicon dihapus.',
            'settings' => $settings,
        ]);
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
            'file' => ['required', 'file', 'max:12288', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx'],
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
            'disk' => $result['disk'] ?? \App\Support\MediaStorage::diskName(),
            'mime' => $result['mime'],
            'size' => $result['size'],
            'alt' => $request->string('alt')->toString() ?: pathinfo($originalName, PATHINFO_FILENAME),
            'width' => $result['width'],
            'height' => $result['height'],
            'optimized' => $result['optimized'],
        ]);

        return response()->json([
            'path' => $result['path'],
            'url' => $result['url'] ?? $media->url,
            'media' => $media,
            'optimized' => $result['optimized'],
            'disk' => $media->disk,
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
