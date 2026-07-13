<?php

use App\Http\Controllers\InstallController;
use App\Http\Controllers\SeoController;
use App\Http\Controllers\SpaController;
use App\Support\Installer;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes — installer + SPA (shared-hosting friendly)
|--------------------------------------------------------------------------
| Document root = backend/public
| API tetap di /api/* (routes/api.php)
| Frontend React di-build ke public/spa dan dilayani di sini.
*/

Route::get('/robots.txt', [SeoController::class, 'robots']);
Route::get('/sitemap.xml', [SeoController::class, 'sitemap']);
Route::get('/llms.txt', [SeoController::class, 'llms']);

// Installer web — rate limit ketat; logic kunci di InstallController / Installer
Route::middleware('throttle:10,1')->group(function () {
    Route::get('/install', [InstallController::class, 'show'])->name('install.show');
});
Route::middleware('throttle:5,60')->group(function () {
    Route::post('/install', [InstallController::class, 'store'])->name('install.store');
});

// Redirect root ke installer HANYA jika web install diizinkan
Route::get('/', function () {
    if (! Installer::isInstalled() && Installer::canInstallViaWeb()) {
        return redirect()->route('install.show');
    }

    return app(SpaController::class)();
});

// SPA catch-all (jangan tangkap api/*, install, storage)
Route::get('/{any}', SpaController::class)
    ->where('any', '^(?!api(?:/|$)|install(?:/|$)|storage(?:/|$)|sanctum(?:/|$)|up$|robots\\.txt$|sitemap\\.xml$|llms\\.txt$).*')
    ->name('spa');
