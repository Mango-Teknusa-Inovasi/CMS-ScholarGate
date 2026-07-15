<?php

namespace App\Support;

/**
 * Whitelist key settings yang boleh di-expose publik / di-edit admin.
 */
class PublicSettings
{
    /** @var list<string> */
    public const KEYS = [
        'site_name',
        'site_tagline',
        'site_description',
        'footer_text',
        'copyright',
        'report_url',
        'contact_email',
        'contact_phone',
        'contact_address',
        'geo_placename',
        'geo_region',
        'geo_lat',
        'geo_lng',
        'organization_type',
        'twitter_handle',
        'google_site_verification',
        'bing_site_verification',
        'logo_path',
        'site_logo',
        'favicon_path',
        'og_image',
        'default_og_image',
    ];

    /**
     * @param  array<string, mixed>  $all
     * @return array<string, mixed>
     */
    public static function filterPublic(array $all): array
    {
        $out = [];
        foreach (self::KEYS as $key) {
            if (array_key_exists($key, $all)) {
                $out[$key] = $all[$key];
            }
        }

        return $out;
    }

    public static function isAllowed(string $key): bool
    {
        return in_array($key, self::KEYS, true);
    }
}
