<?php

namespace App\Models;

use App\Services\HtmlSanitizer;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProfilePage extends Model
{
    use HasUuids;
    protected $fillable = ['title', 'subtitle', 'tabs'];

    protected function casts(): array
    {
        return ['tabs' => 'array'];
    }

    protected static function booted(): void
    {
        static::saving(function (ProfilePage $page) {
            /** @var HtmlSanitizer $sanitizer */
            $sanitizer = app(HtmlSanitizer::class);
            if ($page->isDirty('title') && is_string($page->title)) {
                $page->title = $sanitizer->plain($page->title, 255);
            }
            if ($page->isDirty('subtitle') && is_string($page->subtitle)) {
                $page->subtitle = $sanitizer->plain($page->subtitle, 500);
            }
            if ($page->isDirty('tabs') && is_array($page->tabs)) {
                $page->tabs = $sanitizer->cleanTabs($page->tabs);
            }
        });
    }
}
