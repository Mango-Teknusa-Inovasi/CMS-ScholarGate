<?php

namespace Tests\Unit;

use App\Http\Middleware\SecurityHeaders;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    public function test_baseline_headers_are_set(): void
    {
        $middleware = new SecurityHeaders;
        $request = Request::create('http://example.test/', 'GET');

        $response = $middleware->handle($request, fn () => new Response('ok'));

        $this->assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
        $this->assertSame('SAMEORIGIN', $response->headers->get('X-Frame-Options'));
        $this->assertSame('strict-origin-when-cross-origin', $response->headers->get('Referrer-Policy'));
        $this->assertNotEmpty($response->headers->get('Content-Security-Policy'));
        $this->assertStringContainsString("default-src 'self'", (string) $response->headers->get('Content-Security-Policy'));
        $this->assertStringContainsString("object-src 'none'", (string) $response->headers->get('Content-Security-Policy'));
        $this->assertSame('same-origin', $response->headers->get('Cross-Origin-Opener-Policy'));
    }

    public function test_local_csp_allows_vite_hmr(): void
    {
        $middleware = new SecurityHeaders;
        $request = Request::create('http://127.0.0.1:8010/', 'GET');

        $response = $middleware->handle($request, fn () => new Response('ok'));
        $csp = (string) $response->headers->get('Content-Security-Policy');

        $this->assertStringContainsString('127.0.0.1:5174', $csp);
        $this->assertStringContainsString('script-src-elem', $csp);
        $this->assertNull($response->headers->get('Cross-Origin-Resource-Policy'));
    }

    public function test_csp_allows_instagram_and_safe_iframes(): void
    {
        $middleware = new SecurityHeaders;
        $request = Request::create('https://example.com/', 'GET');

        $response = $middleware->handle($request, fn () => new Response('ok'));
        $csp = (string) $response->headers->get('Content-Security-Policy');

        $this->assertStringContainsString('https://www.instagram.com', $csp);
        $this->assertStringContainsString('https://instagram.com', $csp);
        $this->assertStringContainsString('https://maps.google.com', $csp);

        // Verify HtmlSanitizer preserves Instagram embed iframes
        $sanitizer = app(\App\Services\HtmlSanitizer::class);
        $clean = $sanitizer->clean('<p>Halo</p><iframe src="https://www.instagram.com/p/DF123abc/embed" width="100%" height="480" frameborder="0"></iframe>');
        $this->assertStringContainsString('https://www.instagram.com/p/DF123abc/embed', $clean);
        $this->assertStringContainsString('width="100%"', $clean);
    }
}
