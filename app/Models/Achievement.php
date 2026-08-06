<?php

namespace App\Models;

use App\Services\HtmlSanitizer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Achievement extends Model
{
    use HasUuids;
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

        static::saving(function (Achievement $item) {
            /** @var HtmlSanitizer $sanitizer */
            $sanitizer = app(HtmlSanitizer::class);
            if ($item->isDirty('body') && is_string($item->body)) {
                $item->body = $sanitizer->clean($item->body);
            }
            if ($item->isDirty('excerpt') && is_string($item->excerpt)) {
                $item->excerpt = $sanitizer->plain($item->excerpt, 2000);
            }
        });
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }
}
