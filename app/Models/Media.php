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
        'alt', 'width', 'height', 'optimized',
    ];

    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'optimized' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getUrlAttribute(): string
    {
        return MediaStorage::url($this->path) ?: '';
    }

    public function deleteFile(): void
    {
        MediaStorage::delete($this->path, $this->disk ?: MediaStorage::diskName());
    }
}
