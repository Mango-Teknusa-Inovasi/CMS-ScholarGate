<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Baseline security headers (OWASP Secure Headers guidance).
 *
 * Local/dev: CSP allows Vite HMR (other localhost ports).
 * Production: stricter same-origin asset policy.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
        );
        $response->headers->set('X-XSS-Protection', '0');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');

        // same-site would block Vite HMR modules on another port in local dev
        if (! $this->isLocalDev($request)) {
            $response->headers->set('Cross-Origin-Resource-Policy', 'same-site');
        }

        if ($request->secure() && ! $this->isLocalDev($request)) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        if (! $response->headers->has('Content-Security-Policy')) {
            $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy($request));
        }

        return $response;
    }

    private function isLocalDev(Request $request): bool
    {
        if (app()->environment(['local', 'testing'])) {
            return true;
        }

        $host = $request->getHost();

        return in_array($host, ['localhost', '127.0.0.1', '::1'], true);
    }

    private function contentSecurityPolicy(Request $request): string
    {
        // Vite HMR runs on a different port than artisan serve → not "self"
        $vite = "http://127.0.0.1:5173 http://127.0.0.1:5174 http://localhost:5173 http://localhost:5174 "
            ."http://[::1]:5173 http://[::1]:5174";
        $viteWs = "ws://127.0.0.1:5173 ws://127.0.0.1:5174 ws://localhost:5173 ws://localhost:5174 "
            ."ws://[::1]:5173 ws://[::1]:5174";

        if ($this->isLocalDev($request)) {
            return implode('; ', [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' {$vite}",
                "script-src-elem 'self' 'unsafe-inline' {$vite}",
                "style-src 'self' 'unsafe-inline' https://fonts.bunny.net https://fonts.googleapis.com {$vite}",
                "font-src 'self' data: https://fonts.bunny.net https://fonts.gstatic.com",
                "img-src 'self' data: blob: https: http:",
                "media-src 'self' https: http:",
                "connect-src 'self' https: http: ws: wss: {$vite} {$viteWs}",
                "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'self'",
            ]);
        }

        return implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net https://fonts.googleapis.com",
            "font-src 'self' data: https://fonts.bunny.net https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
            "media-src 'self' https:",
            "connect-src 'self' https: ws: wss:",
            "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            'upgrade-insecure-requests',
        ]);
    }
}
