<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class GalleryItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'title', 'image_path', 'caption', 'sort_order', 'is_active',
    ];

    protected $appends = ['image_url'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function getImageUrlAttribute(): ?string
    {
        return \App\Support\MediaStorage::url($this->image_path);
    }
}
