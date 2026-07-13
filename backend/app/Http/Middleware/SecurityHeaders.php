<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Header keamanan dasar untuk semua response.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('X-XSS-Protection', '0'); // modern browsers: CSP preferred

        // HSTS hanya jika request HTTPS (production di reverse proxy)
        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // Jangan override CSP ketat di API JSON — SPA di-serve same origin
        if (! $response->headers->has('Content-Security-Policy')) {
            // Allow inline styles for SPA; scripts only self + JSON-LD is server-rendered
            $response->headers->set(
                'Content-Security-Policy',
                "default-src 'self'; ".
                "script-src 'self' 'unsafe-inline'; ".
                "style-src 'self' 'unsafe-inline' https://fonts.bunny.net https://fonts.googleapis.com; ".
                "font-src 'self' data: https://fonts.bunny.net https://fonts.gstatic.com; ".
                "img-src 'self' data: blob: https:; ".
                "media-src 'self' https:; ".
                "connect-src 'self' https:; ".
                "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; ".
                "object-src 'none'; ".
                "base-uri 'self'; ".
                "form-action 'self'; ".
                "frame-ancestors 'self'"
            );
        }

        return $response;
    }
}
