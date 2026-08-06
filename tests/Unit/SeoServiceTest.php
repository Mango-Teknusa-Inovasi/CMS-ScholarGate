<?php

namespace Tests\Unit;

use App\Services\SeoService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class SeoServiceTest extends TestCase
{
    #[DataProvider('verificationInputs')]
    public function test_normalize_verification_code(string $input, string $expected): void
    {
        $this->assertSame($expected, SeoService::normalizeVerificationCode($input));
    }

    public static function verificationInputs(): array
    {
        return [
            'raw token' => ['abc123TOKEN', 'abc123TOKEN'],
            'gsc meta tag' => [
                '<meta name="google-site-verification" content="GSC-CODE-99" />',
                'GSC-CODE-99',
            ],
            'bing meta tag' => [
                '<meta name="msvalidate.01" content="BING99" />',
                'BING99',
            ],
            'empty' => ['', ''],
            'assignment form' => ['google-site-verification=XYZ', 'XYZ'],
        ];
    }
}
