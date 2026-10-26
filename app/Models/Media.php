<?php

namespace App\Models;

use App\Support\MediaStorage;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
    use HasUuids;
    protected $table = 'media';

    protected $fillable = [
        'user_id', 'path', 'filename', 'original_filename', 'disk', 'mime', 'size',
        'alt', 'width', 'height', 'optimized', 'variants',
    ];

    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'optimized' => 'boolean',
            'variants' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getUrlAttribute(): string
    {
        return MediaStorage::url($this->path, $this->disk) ?: '';
    }

    public function deleteFile(): void
    {
        $disk = $this->disk ?: MediaStorage::diskName();
        MediaStorage::delete($this->path, $disk);
        foreach ($this->variants ?? [] as $variantPath) {
            MediaStorage::delete($variantPath, $disk);
        }
    }
}
