<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Article;
use App\Models\Banner;
use App\Models\GalleryItem;
use App\Models\Partner;
use App\Models\ServiceItem;
use App\Models\Setting;
use App\Models\WelcomeBlock;
use App\Support\PublicSettings;

class PublicHomeData
{
    public function __construct(private ResponsiveMedia $responsiveMedia) {}

    public function make(): array
    {
        $settings = PublicSettings::filterPublic(Setting::allAsArray());
        $banners = Banner::query()->where('is_active', true)->orderBy('sort_order')->get();
        $welcome = WelcomeBlock::query()->where('key', 'home')->where('is_active', true)->first();
        $articles = Article::published()->with('category:id,name,slug,color')
            ->orderByDesc('is_featured')->orderByDesc('published_at')->limit(5)->get();
        $achievements = Achievement::published()->orderByDesc('is_featured')->orderByDesc('achieved_at')->limit(4)->get();
        $gallery = GalleryItem::query()->where('is_active', true)->orderBy('sort_order')->limit(9)->get();

        $this->responsiveMedia->attach($banners, 'image_path', 'image_srcset');
        $this->responsiveMedia->attach($articles, 'cover_path', 'cover_srcset');
        $this->responsiveMedia->attach($achievements, 'cover_path', 'cover_srcset');
        $this->responsiveMedia->attach($gallery, 'image_path', 'image_srcset');
        if ($welcome) $welcome->setAttribute('image_srcset', $this->responsiveMedia->srcsetFor($welcome->image_path));
        if (! empty($settings['site_logo'])) {
            $settings['site_logo_srcset'] = $this->responsiveMedia->srcsetFor($settings['site_logo']);
        }

        return [
            'settings' => $settings,
            'banners' => $banners,
            'welcome' => $welcome,
            'services' => ServiceItem::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'articles' => $articles,
            'achievements' => $achievements,
            'gallery' => $gallery,
            'partners' => Partner::query()->where('is_active', true)->orderBy('sort_order')->get(),
        ];
    }
}
