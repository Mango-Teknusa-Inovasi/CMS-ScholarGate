<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Achievement extends Model
{
    protected $fillable = [
        'title', 'slug', 'excerpt', 'body', 'cover_path', 'badge_label',
        'is_featured', 'status', 'achieved_at', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'achieved_at' => 'datetime',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Achievement $item) {
            if (empty($item->slug)) {
                $item->slug = Str::slug($item->title).'-'.Str::random(5);
            }
        });
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }
}
