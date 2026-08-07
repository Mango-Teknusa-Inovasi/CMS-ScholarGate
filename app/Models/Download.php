<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Download extends Model
{
    use HasUuids;
    protected $fillable = [
        'title', 'description', 'file_path', 'file_name', 'category',
        'download_count', 'is_active', 'published_at',
    ];

    protected $appends = ['file_url'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'download_count' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function getFileUrlAttribute(): ?string
    {
        return \App\Support\MediaStorage::url($this->file_path);
    }
}
