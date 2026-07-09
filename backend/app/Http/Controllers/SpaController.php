<?php

namespace App\Http\Controllers;

use App\Support\Installer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\File;

class SpaController extends Controller
{
    /**
     * Serve built React SPA from public/spa (production / shared hosting).
     */
    public function __invoke(): Response|RedirectResponse
    {
        if (! Installer::isInstalled()) {
            return redirect()->route('install.show');
        }

        $index = public_path('spa/index.html');

        if (! File::exists($index)) {
            return response()->view('spa-missing', [], 503);
        }

        $html = File::get($index);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-cache, private',
        ]);
    }
}
