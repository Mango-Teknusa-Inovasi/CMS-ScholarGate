<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PublicHomeData;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    public function __invoke(PublicHomeData $home): JsonResponse
    {
        return response()->json($home->make());
    }
}
