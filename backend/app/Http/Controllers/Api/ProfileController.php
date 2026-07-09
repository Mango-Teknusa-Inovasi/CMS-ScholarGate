<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactInfo;
use App\Models\ProfilePage;
use App\Models\QuickService;
use App\Models\WelcomeBlock;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'page' => ProfilePage::query()->first(),
            'welcome' => WelcomeBlock::query()->where('key', 'profile')->where('is_active', true)->first(),
            'contacts' => ContactInfo::query()->orderBy('sort_order')->get(),
            'quick_services' => QuickService::query()->where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }
}
