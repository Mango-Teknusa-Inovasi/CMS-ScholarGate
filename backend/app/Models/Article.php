<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Article extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_id', 'user_id', 'title', 'slug', 'excerpt', 'meta_title',
        'meta_description', 'focus_keyword', 'canonical_url', 'og_image',
        'noindex', 'faq_items', 'body', 'cover_path', 'status', 'is_featured',
        'views', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'noindex' => 'boolean',
            'views' => 'integer',
            'published_at' => 'datetime',
            'faq_items' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Article $article) {
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title).'-'.Str::random(5);
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }
}

