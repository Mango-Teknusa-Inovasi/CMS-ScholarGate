<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactInfo;
use App\Models\ProfilePage;
use App\Models\QuickService;
use App\Models\ServiceItem;
use App\Models\WelcomeBlock;
use App\Services\ResponsiveMedia;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function __invoke(ResponsiveMedia $responsiveMedia): JsonResponse
    {
        $welcome = WelcomeBlock::query()->where('key', 'profile')->where('is_active', true)->first();
        if ($welcome) $welcome->setAttribute('image_srcset', $responsiveMedia->srcsetFor($welcome->image_path));

        return response()->json([
            'page' => ProfilePage::query()->first(),
            'welcome' => $welcome,
            'contacts' => ContactInfo::query()->orderBy('sort_order')->get(),
            'quick_services' => QuickService::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'services' => ServiceItem::query()->where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }
}
