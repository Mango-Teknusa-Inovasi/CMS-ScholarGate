<?php

namespace App\Support;

/**
 * Validasi URL / path untuk field CMS (menu, CTA, link).
 * Blok javascript:, data:, vbscript:.
 */
class SafeUrl
{
    /**
     * Normalize & validate. Returns null if invalid.
     */
    public static function normalize(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }

        $url = trim($url);
        if ($url === '' || $url === '#') {
            return null;
        }

        $lower = strtolower($url);

        if (
            str_starts_with($lower, 'javascript:')
            || str_starts_with($lower, 'data:')
            || str_starts_with($lower, 'vbscript:')
            || str_starts_with($lower, 'file:')
        ) {
            return null;
        }

        // Internal path
        if (str_starts_with($url, '/') && ! str_starts_with($url, '//')) {
            return $url;
        }

        // Protocol-relative → https
        if (str_starts_with($url, '//')) {
            return 'https:'.$url;
        }

        if (preg_match('#^(https?|mailto|tel):#i', $url)) {
            return $url;
        }

        // Bare domain
        if (preg_match('#^[a-z0-9.-]+\.[a-z]{2,}([/:?]|$)#i', $url)) {
            return 'https://'.$url;
        }

        return null;
    }

    public static function isAllowed(?string $url): bool
    {
        if ($url === null || trim($url) === '' || trim($url) === '#') {
            return true; // empty optional
        }

        return self::normalize($url) !== null;
    }
}
