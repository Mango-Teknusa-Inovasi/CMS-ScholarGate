<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum SPA/session auth for same-origin /api/* + Inertia
        $middleware->statefulApi();

        // Default throttle grup api/* (RateLimiter "api" = 120/mnt)
        $middleware->throttleApi('api');

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
            'super_admin' => \App\Http\Middleware\EnsureSuperAdmin::class,
        ]);

        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        // CSRF required for session cookie auth (Inertia + API from same origin)
        $middleware->validateCsrfTokens(except: [
            // keep empty — all mutating routes need CSRF or Bearer
        ]);

        // Di belakang reverse proxy (nginx/caddy/cloudflare)
        $middleware->trustProxies(at: '*');

        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('admin') || $request->is('admin/*')
            ? route('admin.login')
            : route('login'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $exception, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                $status = $response->getStatusCode();

                if (in_array($status, [500, 503, 404, 403, 419])) {
                    return \Inertia\Inertia::render('ErrorPage', [
                        'status' => $status,
                        'message' => match ($status) {
                            404 => 'Halaman tidak ditemukan. Halaman yang Anda cari mungkin telah dipindahkan atau tidak pernah ada.',
                            403 => 'Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.',
                            419 => 'Sesi telah berakhir. Silakan muat ulang halaman dan coba lagi.',
                            503 => 'Layanan sedang dalam pemeliharaan. Silakan kembali beberapa saat lagi.',
                            500 => 'Terjadi kesalahan pada server. Tim teknis kami telah diberitahu.',
                            default => 'Terjadi kesalahan tidak terduga.',
                        },
                    ])->toResponse($request)->setStatusCode($status);
                }
            }

            return $response;
        });
    })->create();
