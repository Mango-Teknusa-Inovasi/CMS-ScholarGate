<?php

namespace Tests\Feature;

use App\Services\ImageOptimizer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use App\Support\MediaStorage;
use Tests\TestCase;

class ImageOptimizerResponsiveVariantsTest extends TestCase
{
    public function test_uploaded_raster_keeps_original_and_creates_webp_responsive_variants(): void
    {
        Storage::fake('local');
        foreach (['public', 'r2', 's3'] as $disk) {
            Storage::fake($disk);
            config(['filesystems.default' => $disk, "filesystems.disks.{$disk}.folder" => 'test-media']);

            $file = UploadedFile::fake()->image('campus.jpg', 1200, 800)->size(120);
            $result = app(ImageOptimizer::class)->store($file, "uploads/{$disk}");

            $this->assertSame($disk, $result['disk']);
            $this->assertSame('image/webp', $result['mime']);
            $this->assertNotEmpty($result['variants']);
            $key = in_array($disk, ['r2', 's3'], true) ? MediaStorage::prefixPath($result['path'], $disk) : $result['path'];
            Storage::disk($disk)->assertExists($key);
            foreach ($result['variants'] as $variantPath) {
                $variantKey = in_array($disk, ['r2', 's3'], true) ? MediaStorage::prefixPath($variantPath, $disk) : $variantPath;
                Storage::disk($disk)->assertExists($variantKey);
            }
        }
        Storage::disk('local')->assertDirectoryEmpty('tmp/optimize');
    }
}
