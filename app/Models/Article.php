<?php

namespace App\Models;

use App\Services\HtmlSanitizer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Article extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'category_id', 'user_id', 'title', 'slug', 'excerpt', 'meta_title',
        'meta_description', 'focus_keyword', 'canonical_url', 'og_image',
        'noindex', 'faq_items', 'body', 'cover_path', 'status', 'is_featured',
        'views', 'published_at', 'preview_token', 'preview_token_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'noindex' => 'boolean',
            'views' => 'integer',
            'published_at' => 'datetime',
            'preview_token_expires_at' => 'datetime',
            'faq_items' => 'array',
        ];
    }

    /**
     * Buat / perpanjang token pratinjau draf (rahasia, noindex).
     */
    public function issuePreviewToken(int $days = 14): string
    {
        $this->preview_token = Str::random(48);
        $this->preview_token_expires_at = now()->addDays($days);
        $this->save();

        return $this->preview_token;
    }

    public function isPreviewTokenValid(?string $token): bool
    {
        if (! $token || ! $this->preview_token) {
            return false;
        }
        if (! hash_equals($this->preview_token, $token)) {
            return false;
        }
        if ($this->preview_token_expires_at && $this->preview_token_expires_at->isPast()) {
            return false;
        }

        return true;
    }

    protected static function booted(): void
    {
        static::creating(function (Article $article) {
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title).'-'.Str::random(5);
            }
        });

        static::saving(function (Article $article) {
            /** @var HtmlSanitizer $sanitizer */
            $sanitizer = app(HtmlSanitizer::class);

            if ($article->isDirty('body') && is_string($article->body)) {
                $article->body = $sanitizer->clean($article->body);
            }
            if ($article->isDirty('excerpt') && is_string($article->excerpt)) {
                $article->excerpt = $sanitizer->plain($article->excerpt, 2000);
            }
            if ($article->isDirty('faq_items')) {
                $faq = $article->faq_items;
                $article->faq_items = is_array($faq) ? $sanitizer->cleanFaq($faq) : $faq;
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

