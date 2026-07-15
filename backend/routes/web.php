<?php

use App\Http\Controllers\InstallController;
use App\Http\Controllers\SeoController;
use App\Http\Controllers\SpaController;
use App\Http\Controllers\UpdateController;
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

// Easy update setelah ganti file — login admin di form
Route::middleware('throttle:20,1')->group(function () {
    Route::get('/update', [UpdateController::class, 'show'])->name('update.show');
});
Route::middleware('throttle:5,30')->group(function () {
    Route::post('/update', [UpdateController::class, 'store'])->name('update.store');
});

// Redirect root ke installer HANYA jika web install diizinkan
Route::get('/', function () {
    if (! Installer::isInstalled() && Installer::canInstallViaWeb()) {
        return redirect()->route('install.show');
    }

    return app(SpaController::class)();
});

// SPA catch-all (jangan tangkap api/*, install, update, storage)
Route::get('/{any}', SpaController::class)
    ->where('any', '^(?!api(?:/|$)|install(?:/|$)|update(?:/|$)|storage(?:/|$)|sanctum(?:/|$)|up$|robots\\.txt$|sitemap\\.xml$|llms\\.txt$).*')
    ->name('spa');
