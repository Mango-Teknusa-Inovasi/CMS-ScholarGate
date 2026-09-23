<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @php
        $seo = $page['props']['seo'] ?? null;
        $brand = \App\Services\BrandLogoService::brandUrls();
    @endphp

    @if(!empty($brand['favicon']))
        <link rel="icon" type="image/png" sizes="32x32" href="{{ $brand['favicon'] }}">
        <link rel="shortcut icon" href="{{ $brand['favicon'] }}">
    @else
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    @endif
    @if(!empty($brand['favicon_16']))
        <link rel="icon" type="image/png" sizes="16x16" href="{{ $brand['favicon_16'] }}">
    @endif
    @if(!empty($brand['apple']))
        <link rel="apple-touch-icon" sizes="180x180" href="{{ $brand['apple'] }}">
    @endif
    <link rel="manifest" href="/site.webmanifest">

    <!-- Preconnect & Load Google Fonts and Storage CDN asynchronously for optimized FCP/LCP -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    @php
        $r2PublicUrl = config('filesystems.disks.r2.url') ?: env('R2_PUBLIC_URL');
        $r2Origin = null;
        if ($r2PublicUrl) {
            $parsed = parse_url($r2PublicUrl);
            if (!empty($parsed['scheme']) && !empty($parsed['host'])) {
                $r2Origin = $parsed['scheme'] . '://' . $parsed['host'] . (!empty($parsed['port']) ? ':' . $parsed['port'] : '');
            }
        }
    @endphp
    @if($r2Origin)
        <link rel="preconnect" href="{{ $r2Origin }}" crossorigin>
    @endif
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap" media="print" onload="this.media='all'">
    <noscript>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap">
    </noscript>

    @if(is_array($seo))
        {{-- Blade {{ }} already escapes — do not pre-escape with e() --}}
        @php
            $title = (string) ($seo['title'] ?? config('app.name', 'Portal Resmi'));
            $desc = (string) ($seo['description'] ?? '');
            $canonical = (string) ($seo['canonical'] ?? '');
            $ogType = (string) ($seo['og_type'] ?? 'website');
            $robots = (string) ($seo['robots'] ?? 'index,follow');
            $image = ! empty($seo['og_image']) ? (string) $seo['og_image'] : '';
            $siteName = (string) ($seo['site_name'] ?? config('app.name', 'Portal Resmi'));
        @endphp
        <title inertia>{{ $title }}</title>
    @else
        <title inertia>{{ config('app.name', 'Portal Resmi') }}</title>
    @endif

    @if(is_array($seo))
        @if($desc !== '')
            <meta name="description" content="{{ $desc }}">
        @endif
        <meta name="robots" content="{{ $robots }}">
        <meta name="googlebot" content="{{ $robots }}">
        @if($canonical !== '')
            <link rel="canonical" href="{{ $canonical }}">
            <link rel="alternate" hreflang="id" href="{{ $canonical }}">
            <link rel="alternate" hreflang="x-default" href="{{ $canonical }}">
        @endif
        <meta property="og:locale" content="id_ID">
        <meta property="og:type" content="{{ $ogType }}">
        <meta property="og:site_name" content="{{ $siteName }}">
        <meta property="og:title" content="{{ $title }}">
        @if($desc !== '')
            <meta property="og:description" content="{{ $desc }}">
        @endif
        @if($canonical !== '')
            <meta property="og:url" content="{{ $canonical }}">
        @endif
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $title }}">
        @if($desc !== '')
            <meta name="twitter:description" content="{{ $desc }}">
        @endif
        @if($image !== '')
            <meta property="og:image" content="{{ $image }}">
            <meta property="og:image:alt" content="{{ $title }}">
            <meta name="twitter:image" content="{{ $image }}">
        @endif
        @if(!empty($seo['google_site_verification']))
            <meta name="google-site-verification" content="{{ $seo['google_site_verification'] }}">
        @endif
        @if(!empty($seo['bing_site_verification']))
            <meta name="msvalidate.01" content="{{ $seo['bing_site_verification'] }}">
        @endif
        @if(!empty($seo['geo_region']))
            <meta name="geo.region" content="{{ $seo['geo_region'] }}">
        @endif
        @if(!empty($seo['geo_placename']))
            <meta name="geo.placename" content="{{ $seo['geo_placename'] }}">
        @endif
        @if(!empty($seo['geo_position']))
            <meta name="geo.position" content="{{ $seo['geo_position'] }}">
            <meta name="ICBM" content="{{ str_replace(';', ', ', (string) $seo['geo_position']) }}">
        @endif
        @if(!empty($seo['json_ld']) && is_array($seo['json_ld']))
            <script type="application/ld+json">{!! json_encode($seo['json_ld'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) !!}</script>
        @endif
        <link rel="sitemap" type="application/xml" href="/sitemap.xml">
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs">
    @endif

    @viteReactRefresh
    @vite(['resources/js/app.tsx'])
    @inertiaHead
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
