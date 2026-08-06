<?php

namespace App\Models;

use App\Services\HtmlSanitizer;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LegalPage extends Model
{
    use HasUuids;
    public const KEY_PRIVACY = 'privacy';

    public const KEY_TERMS = 'terms';

    /** @var list<string> */
    public const KEYS = [self::KEY_PRIVACY, self::KEY_TERMS];

    protected $fillable = [
        'key',
        'title',
        'body',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (LegalPage $page) {
            /** @var HtmlSanitizer $sanitizer */
            $sanitizer = app(HtmlSanitizer::class);
            if ($page->isDirty('title') && is_string($page->title)) {
                $page->title = $sanitizer->plain($page->title, 255);
            }
            if ($page->isDirty('body') && is_string($page->body)) {
                $page->body = $sanitizer->clean($page->body);
            }
        });
    }

    public static function findByKey(string $key): ?self
    {
        return static::query()->where('key', $key)->first();
    }

    public function publicPath(): string
    {
        return match ($this->key) {
            self::KEY_PRIVACY => '/kebijakan-privasi',
            self::KEY_TERMS => '/syarat-ketentuan',
            default => '/'.$this->key,
        };
    }
}
