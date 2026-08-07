<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Partner extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'logo_path', 'url', 'sort_order', 'is_active',
    ];

    protected $appends = ['logo_url'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function getLogoUrlAttribute(): ?string
    {
        return \App\Support\MediaStorage::url($this->logo_path);
    }
}
