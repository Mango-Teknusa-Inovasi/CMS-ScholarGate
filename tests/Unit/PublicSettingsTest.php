<?php

namespace Tests\Unit;

use App\Support\PublicSettings;
use PHPUnit\Framework\TestCase;

class PublicSettingsTest extends TestCase
{
    public function test_whitelist_includes_brand_keys(): void
    {
        $this->assertTrue(PublicSettings::isAllowed('site_name'));
        $this->assertTrue(PublicSettings::isAllowed('site_logo'));
        $this->assertTrue(PublicSettings::isAllowed('favicon_path'));
        $this->assertTrue(PublicSettings::isAllowed('apple_touch_icon_path'));
        $this->assertFalse(PublicSettings::isAllowed('app_key'));
        $this->assertFalse(PublicSettings::isAllowed('password'));
    }

    public function test_filter_public_keeps_only_whitelist(): void
    {
        $filtered = PublicSettings::filterPublic([
            'site_name' => 'Demo School',
            'site_logo' => 'uploads/logo.webp',
            'secret_internal' => 'nope',
            'DB_PASSWORD' => 'x',
        ]);

        $this->assertSame('Demo School', $filtered['site_name']);
        $this->assertSame('uploads/logo.webp', $filtered['site_logo']);
        $this->assertArrayNotHasKey('secret_internal', $filtered);
        $this->assertArrayNotHasKey('DB_PASSWORD', $filtered);
    }
}
