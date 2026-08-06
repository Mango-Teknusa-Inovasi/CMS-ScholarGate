<?php

namespace Tests\Unit;

use App\Support\SafeUrl;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class SafeUrlTest extends TestCase
{
    #[DataProvider('allowedUrls')]
    public function test_normalize_allows_safe_urls(string $input, string $expected): void
    {
        $this->assertSame($expected, SafeUrl::normalize($input));
        $this->assertTrue(SafeUrl::isAllowed($input));
    }

    public static function allowedUrls(): array
    {
        return [
            'internal path' => ['/artikel', '/artikel'],
            'https' => ['https://example.com/page', 'https://example.com/page'],
            'http' => ['http://example.com', 'http://example.com'],
            'mailto' => ['mailto:info@school.test', 'mailto:info@school.test'],
            'tel' => ['tel:+621234', 'tel:+621234'],
            'protocol relative' => ['//cdn.example.com/a.png', 'https://cdn.example.com/a.png'],
            'bare domain' => ['school.example.id/about', 'https://school.example.id/about'],
        ];
    }

    #[DataProvider('blockedUrls')]
    public function test_normalize_blocks_dangerous_schemes(string $input): void
    {
        $this->assertNull(SafeUrl::normalize($input));
        $this->assertFalse(SafeUrl::isAllowed($input));
    }

    public static function blockedUrls(): array
    {
        return [
            'javascript' => ['javascript:alert(1)'],
            'data uri' => ['data:text/html,<script>'],
            'vbscript' => ['vbscript:msgbox'],
            'file' => ['file:///etc/passwd'],
        ];
    }

    public function test_empty_and_hash_normalize_to_null_but_are_not_attack_vectors(): void
    {
        $this->assertNull(SafeUrl::normalize(''));
        $this->assertNull(SafeUrl::normalize('#'));
        // Empty / # are treated as "no URL" (allowed as absence), not dangerous schemes
        $this->assertTrue(SafeUrl::isAllowed(''));
        $this->assertTrue(SafeUrl::isAllowed('#'));
    }
}
