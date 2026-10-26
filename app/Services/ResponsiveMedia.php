<?php

namespace App\Services;

use App\Models\Media;
use App\Support\MediaStorage;
use Illuminate\Support\Collection;

class ResponsiveMedia
{
    /** Add image srcsets in one query while keeping existing response fields intact. */
    public function attach(Collection $items, string $pathField, string $srcsetField): Collection
    {
        $paths = $items->pluck($pathField)->filter(fn ($path) => is_string($path) && $path !== '')
            ->map(fn ($path) => MediaStorage::relativePath($path))->filter()->unique();
        if ($paths->isEmpty()) return $items;

        $media = Media::query()->whereIn('path', $paths)->get(['path', 'disk', 'width', 'variants'])->keyBy('path');

        return $items->each(function ($item) use ($media, $pathField, $srcsetField) {
            $record = $media->get(MediaStorage::relativePath((string) data_get($item, $pathField)));
            $variants = $record?->variants ?? [];
            $entries = [];
            foreach ($variants as $width => $path) {
                $url = MediaStorage::url($path, $record->disk);
                if ($url) $entries[] = $url.' '.(int) $width.'w';
            }
            if ($record?->width && $record->path) {
                $original = MediaStorage::url($record->path, $record->disk);
                if ($original) $entries[] = $original.' '.(int) $record->width.'w';
            }
            $item->setAttribute($srcsetField, implode(', ', $entries) ?: null);
        });
    }

    public function srcsetFor(?string $path): ?string
    {
        if (! $path) return null;
        $record = Media::query()->where('path', MediaStorage::relativePath($path))->first(['path', 'disk', 'width', 'variants']);
        if (! $record || ! is_array($record->variants)) return null;

        $entries = collect($record->variants)
            ->map(fn ($variantPath, $width) => MediaStorage::url($variantPath, $record->disk).' '.(int) $width.'w')
            ->all();
        if ($record->width) $entries[] = MediaStorage::url($record->path, $record->disk).' '.(int) $record->width.'w';

        return implode(', ', array_filter($entries)) ?: null;
    }

}
