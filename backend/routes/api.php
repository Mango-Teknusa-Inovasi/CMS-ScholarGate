<?php

use App\Http\Controllers\Api\Admin\ArticleAdminController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\MediaAdminController;
use App\Http\Controllers\Api\Admin\ResourceAdminController;
use App\Http\Controllers\Api\Admin\TagAdminController;
use App\Http\Controllers\Api\Admin\UserAdminController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PublicDataController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public
    Route::get('/home', HomeController::class);
    Route::get('/profile', ProfileController::class);
    Route::get('/articles', [ArticleController::class, 'index']);
    Route::get('/articles/{slug}', [ArticleController::class, 'show']);
    Route::get('/categories', [PublicDataController::class, 'categories']);
    Route::get('/achievements', [PublicDataController::class, 'achievements']);
    Route::get('/achievements/{slug}', [PublicDataController::class, 'achievementShow']);
    Route::get('/downloads', [PublicDataController::class, 'downloads']);
    Route::get('/ekstrakurikuler', [PublicDataController::class, 'extracurriculars']);
    Route::get('/settings/public', [PublicDataController::class, 'settings']);
    Route::get('/menus', [PublicDataController::class, 'menus']);
    Route::get('/seo/home', [\App\Http\Controllers\SeoController::class, 'metaHome']);
    Route::get('/seo/page/{page}', [\App\Http\Controllers\SeoController::class, 'metaPage']);
    Route::get('/seo/article/{slug}', [\App\Http\Controllers\SeoController::class, 'metaArticle']);

    // Auth
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::prefix('admin')->group(function () {
            Route::get('/dashboard', DashboardController::class);

            // Articles (WordPress-like)
            Route::get('/articles', [ArticleAdminController::class, 'index']);
            Route::post('/articles', [ArticleAdminController::class, 'store']);
            Route::post('/articles/bulk-delete', [ArticleAdminController::class, 'bulkDestroy']);
            Route::post('/articles/{id}/restore', [ArticleAdminController::class, 'restore']);
            Route::delete('/articles/{id}/force', [ArticleAdminController::class, 'forceDestroy']);
            Route::get('/articles/{article}', [ArticleAdminController::class, 'show']);
            Route::put('/articles/{article}', [ArticleAdminController::class, 'update']);
            Route::delete('/articles/{article}', [ArticleAdminController::class, 'destroy']);

            // Tags
            Route::get('/tags', [TagAdminController::class, 'index']);
            Route::post('/tags', [TagAdminController::class, 'store']);
            Route::put('/tags/{tag}', [TagAdminController::class, 'update']);
            Route::delete('/tags/{tag}', [TagAdminController::class, 'destroy']);

            // Media library
            Route::get('/media-library', [MediaAdminController::class, 'index']);
            Route::post('/media-library', [MediaAdminController::class, 'store']);
            Route::post('/media-library/bulk-delete', [MediaAdminController::class, 'bulkDestroy']);
            Route::put('/media-library/{medium}', [MediaAdminController::class, 'update']);
            Route::delete('/media-library/{medium}', [MediaAdminController::class, 'destroy']);

            // Legacy upload alias (still records to media library)
            Route::post('/media', [ResourceAdminController::class, 'upload']);

            // Users
            Route::get('/users', [UserAdminController::class, 'index']);
            Route::post('/users', [UserAdminController::class, 'store']);
            Route::put('/users/{user}', [UserAdminController::class, 'update']);
            Route::delete('/users/{user}', [UserAdminController::class, 'destroy']);

            // Settings & profile
            Route::get('/settings', [ResourceAdminController::class, 'settings']);
            Route::put('/settings', [ResourceAdminController::class, 'updateSettings']);
            Route::get('/profile-page', [ResourceAdminController::class, 'profilePage']);
            Route::put('/profile-page', [ResourceAdminController::class, 'updateProfilePage']);

            // Generic resources last
            Route::get('/{resource}', [ResourceAdminController::class, 'index']);
            Route::post('/{resource}', [ResourceAdminController::class, 'store']);
            Route::put('/{resource}/{id}', [ResourceAdminController::class, 'update']);
            Route::delete('/{resource}/{id}', [ResourceAdminController::class, 'destroy']);
        });
    });
});
