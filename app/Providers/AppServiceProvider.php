<?php

namespace App\Providers;

use App\Services\HtmlSanitizer;
use App\Support\Installer;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(HtmlSanitizer::class);

        // Saat aplikasi belum ter-install, paksa session & cache pakai 'file'
        // agar halaman /install bisa diakses tanpa error DB/session table.
        if (! Installer::isInstalled()) {
            config([
                'session.driver' => 'file',
                'cache.default' => 'file',
            ]);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * Named rate limiters — pakai di routes: throttle:nama
     */
    private function configureRateLimiting(): void
    {
        // Default seluruh grup /api/* (per user atau IP)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Read publik umum (home, settings, menus, list)
        RateLimiter::for('public', function (Request $request) {
            return Limit::perMinute(90)->by($request->ip());
        });

        // Search / list artikel (LIKE query) — lebih ketat
        RateLimiter::for('public-search', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        // Detail artikel (views) — batasi hit per IP
        RateLimiter::for('public-read', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        // Preview token — cegah brute-force token
        RateLimiter::for('preview', function (Request $request) {
            return [
                Limit::perMinute(20)->by($request->ip()),
                Limit::perHour(100)->by($request->ip()),
            ];
        });

        // Login: per IP + per email
        RateLimiter::for('auth-login', function (Request $request) {
            $email = strtolower((string) $request->input('email', ''));

            return [
                Limit::perMinute(10)->by($request->ip()),
                Limit::perMinute(5)->by($email.'|'.$request->ip()),
            ];
        });

        // Register: ketat anti spam akun
        RateLimiter::for('auth-register', function (Request $request) {
            return [
                Limit::perMinute(3)->by($request->ip()),
                Limit::perHour(10)->by($request->ip()),
            ];
        });

        // SEO meta bots — longgar tapi tetap ada plafon
        RateLimiter::for('seo', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });
    }
}

