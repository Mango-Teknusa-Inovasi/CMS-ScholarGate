<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
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
        return asset('storage/'.$this->path);
    }

    public function deleteFile(): void
    {
        Storage::disk($this->disk ?: 'public')->delete($this->path);
    }
}
