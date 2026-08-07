<?php

namespace App\Models;

use App\Services\HtmlSanitizer;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WelcomeBlock extends Model
{
    use HasUuids;

    protected $fillable = [
        'key', 'title', 'body', 'image_path', 'badge_left',
        'badge_right', 'chat_label', 'is_active',
    ];

    protected $appends = ['image_url'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function getImageUrlAttribute(): ?string
    {
        return \App\Support\MediaStorage::url($this->image_path);
    }

    protected static function booted(): void
    {
        static::saving(function (WelcomeBlock $block) {
            /** @var HtmlSanitizer $sanitizer */
            $sanitizer = app(HtmlSanitizer::class);
            if ($block->isDirty('body') && is_string($block->body)) {
                // Boleh plain atau HTML — purify aman untuk keduanya
                $block->body = $sanitizer->clean($block->body);
            }
            if ($block->isDirty('title') && is_string($block->title)) {
                $block->title = $sanitizer->plain($block->title, 255);
            }
        });
    }
}
