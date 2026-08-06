<?php

use App\Http\Controllers\InstallController;
use App\Http\Controllers\Inertia\PageController;
use App\Http\Controllers\SeoController;
use App\Http\Controllers\UpdateController;
use App\Support\Installer;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes — Inertia monolith (shared-hosting friendly)
|--------------------------------------------------------------------------
| Document root = backend/public
| API tetap di /api/* (routes/api.php) — session + CSRF untuk UI
| Frontend React di-build ke public/build via Vite
*/

Route::get('/robots.txt', [SeoController::class, 'robots']);
Route::get('/sitemap.xml', [SeoController::class, 'sitemap']);
Route::get('/llms.txt', [SeoController::class, 'llms']);

// Installer web — rate limit ketat
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

    return app(PageController::class)->home(request());
})->name('home');

/*
|--------------------------------------------------------------------------
| Public portal (Inertia)
|--------------------------------------------------------------------------
*/
Route::controller(PageController::class)->group(function () {
    Route::get('/profil', 'profile')->name('profile');
    Route::get('/artikel', 'articles')->name('articles');
    Route::get('/artikel/{slug}', 'articleShow')->name('articles.show');
    Route::get('/preview/artikel/{token}', 'articlePreview')->name('articles.preview');
    Route::get('/prestasi', 'achievements')->name('achievements');
    Route::get('/prestasi/{slug}', 'achievementShow')->name('achievements.show');
    Route::get('/ekstrakurikuler', 'extracurricular')->name('extracurricular');
    Route::get('/aplikasi', fn () => redirect('/ekstrakurikuler', 301));
    Route::get('/download', 'downloads')->name('downloads');
    Route::get('/kebijakan-privasi', 'privacy')->name('legal.privacy');
    Route::get('/syarat-ketentuan', 'terms')->name('legal.terms');
    Route::get('/privacy', fn () => redirect('/kebijakan-privasi', 301));
    Route::get('/terms', fn () => redirect('/syarat-ketentuan', 301));

    Route::get('/login', 'memberLogin')->name('login');
    Route::get('/daftar', 'memberRegister')->name('register');
    Route::get('/register', fn () => redirect('/daftar', 301));
    Route::get('/member/login', fn () => redirect('/login', 301));
    Route::get('/akun', 'memberAccount')->name('account');

    Route::get('/admin/login', 'adminLogin')->name('admin.login');
});

/*
|--------------------------------------------------------------------------
| Admin CMS (Inertia) — session auth + admin middleware
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    $p = PageController::class;

    Route::get('/', [$p, 'adminDashboard'])->name('dashboard');
    Route::get('/articles', [$p, 'adminArticles'])->name('articles');
    Route::get('/articles/new', [$p, 'adminArticleNew'])->name('articles.new');
    Route::get('/articles/{id}/edit', [$p, 'adminArticleEdit'])->name('articles.edit');

    Route::get('/welcome', [$p, 'adminWelcome'])->name('welcome');
    Route::get('/profile-content', [$p, 'adminProfileContent'])->name('profile-content');
    Route::get('/media', [$p, 'adminMedia'])->name('media');
    Route::get('/media-guide', [$p, 'adminMediaGuide'])->name('media-guide');
    Route::get('/settings', [$p, 'adminSettings'])->name('settings');
    Route::get('/legal', [$p, 'adminLegal'])->name('legal');

    Route::middleware('super_admin')->group(function () use ($p) {
        Route::get('/users', [$p, 'adminUsers'])->name('users');
        Route::get('/backups', [$p, 'adminBackups'])->name('backups');
    });

    $resources = [
        'categories', 'menus', 'banners', 'services', 'contacts',
        'quick-services', 'achievements', 'gallery', 'partners',
        'ekstrakurikuler', 'downloads',
    ];

    foreach ($resources as $resource) {
        Route::get("/{$resource}", fn () => app($p)->adminResourceList($resource))
            ->name("{$resource}.index");
        Route::get("/{$resource}/new", fn () => app($p)->adminResourceNew($resource))
            ->name("{$resource}.new");
        Route::get("/{$resource}/{id}/edit", fn (string $id) => app($p)->adminResourceEdit($resource, $id))
            ->name("{$resource}.edit");
    }
});
