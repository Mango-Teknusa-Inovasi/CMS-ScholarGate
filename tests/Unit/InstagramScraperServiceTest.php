<?php

namespace Tests\Unit;

use App\Services\Instagram\InstagramParser;
use App\Services\InstagramScraperService;
use PHPUnit\Framework\TestCase;

class InstagramScraperServiceTest extends TestCase
{
    public function test_extract_shortcode_from_various_urls(): void
    {
        $this->assertSame('DF123abc', InstagramScraperService::extractShortcode('https://www.instagram.com/p/DF123abc/'));
        $this->assertSame('DF123abc', InstagramScraperService::extractShortcode('https://instagram.com/p/DF123abc'));
        $this->assertSame('ReelCode9', InstagramScraperService::extractShortcode('https://www.instagram.com/reel/ReelCode9/?igsh=MWQ='));
        $this->assertSame('TvCode45', InstagramScraperService::extractShortcode('https://instagram.com/tv/TvCode45/'));
        $this->assertNull(InstagramScraperService::extractShortcode('https://www.google.com'));
        $this->assertSame('validCode_2', InstagramScraperService::extractShortcode('https://m.instagram.com/reel/validCode_2/?igsh=abc'));
        $this->assertNull(InstagramScraperService::extractShortcode('https://instagram.com.evil.example/p/DF123abc/'));
        $this->assertNull(InstagramScraperService::extractShortcode('https://instagram.com@evil.example/p/DF123abc/'));
        $this->assertNull(InstagramScraperService::extractShortcode('https://instagram.com/p/DF123abc/extra'));
        $this->assertNull(InstagramScraperService::extractShortcode(''));
    }

    public function test_parse_single_image_response(): void
    {
        $service = new InstagramScraperService;
        $payload = [
            'data' => [
                'caption' => ['text' => 'Kegiatan upacara hari Senin SMAN 1 Gedeg #sman1gedeg'],
                'user' => ['username' => 'sman1gedeg'],
                'taken_at' => 1725619200,
                'image_versions2' => [
                    'candidates' => [
                        ['url' => 'https://scontent.cdninstagram.com/photo1.jpg'],
                    ],
                ],
            ],
        ];

        $parsed = $service->parseInstagramResponse($payload, 'DF123abc');

        $this->assertSame('DF123abc', $parsed['shortcode']);
        $this->assertStringContainsString('Kegiatan upacara', $parsed['caption']);
        $this->assertSame('sman1gedeg', $parsed['author']);
        $this->assertCount(1, $parsed['images']);
        $this->assertSame('https://scontent.cdninstagram.com/photo1.jpg', $parsed['images'][0]);
    }

    public function test_parse_carousel_multi_images_response(): void
    {
        $service = new InstagramScraperService;
        $payload = [
            'data' => [
                'title' => 'Dokumentasi Gelar Karya P5',
                'owner' => ['username' => 'sman1gedeg'],
                'carousel_media' => [
                    [
                        'image_versions2' => [
                            'candidates' => [['url' => 'https://scontent.cdninstagram.com/slide1.jpg']],
                        ],
                    ],
                    [
                        'image_versions2' => [
                            'candidates' => [['url' => 'https://scontent.cdninstagram.com/slide2.jpg']],
                        ],
                    ],
                    [
                        'display_url' => 'https://scontent.cdninstagram.com/slide3.jpg',
                    ],
                ],
            ],
        ];

        $parsed = $service->parseInstagramResponse($payload, 'CarouselCode');

        $this->assertSame('CarouselCode', $parsed['shortcode']);
        $this->assertSame('Dokumentasi Gelar Karya P5', $parsed['caption']);
        $this->assertSame('sman1gedeg', $parsed['author']);
        $this->assertCount(3, $parsed['images']);
        $this->assertSame('https://scontent.cdninstagram.com/slide1.jpg', $parsed['images'][0]);
        $this->assertSame('https://scontent.cdninstagram.com/slide2.jpg', $parsed['images'][1]);
        $this->assertSame('https://scontent.cdninstagram.com/slide3.jpg', $parsed['images'][2]);
    }

    public function test_clean_caption_from_og_title_and_desc(): void
    {
        $service = new InstagramScraperService;

        // English format
        $ogTitleEn = 'SMA Negeri 1 Gedeg on Instagram: "Selamat kepada para pemenang LKBB 2026!"';
        $this->assertSame('Selamat kepada para pemenang LKBB 2026!', $service->cleanCaptionFromOgTitle($ogTitleEn));

        // Indonesian format
        $ogTitleId = 'SMA Negeri 1 Gedeg di Instagram: "Dengan penuh rasa syukur dan kebanggaan..."';
        $this->assertSame('Dengan penuh rasa syukur dan kebanggaan...', $service->cleanCaptionFromOgTitle($ogTitleId));

        // Description format
        $ogDesc = '45 likes, 3 comments - smansagemoker on February 20, 2026: "Kegiatan Masa Pengenalan Lingkungan Sekolah (MPLS)."';
        $this->assertSame('Kegiatan Masa Pengenalan Lingkungan Sekolah (MPLS).', $service->cleanCaptionFromOgDesc($ogDesc));
    }

    public function test_extract_images_from_html_and_filter_avatars(): void
    {
        $service = new InstagramScraperService;

        $sampleHtml = <<<'HTML'
<html>
<head>
    <meta property="og:image" content="https://scontent.cdninstagram.com/v/t51.82787-15/post_image_1.jpg" />
    <meta name="twitter:image" content="https://scontent.cdninstagram.com/v/t51.82787-15/post_image_1.jpg" />
</head>
<body>
</body>
</html>
HTML;

        $images = $service->extractImagesFromHtml($sampleHtml);

        $this->assertCount(1, $images);
        $this->assertSame('https://scontent.cdninstagram.com/v/t51.82787-15/post_image_1.jpg', $images[0]);
    }

    public function test_extracts_meta_values_when_attributes_use_single_quotes_or_different_order(): void
    {
        $parser = new InstagramParser;
        $html = "<meta content='https://scontent.cdninstagram.com/photo.jpg' name='twitter:image'>"
            ."<meta content='Sekolah di Instagram: &quot;Pentas seni siswa&quot;' property='og:title'>";

        $this->assertSame('https://scontent.cdninstagram.com/photo.jpg', $parser->metaContent($html, 'twitter:image'));
        $this->assertSame('Sekolah di Instagram: "Pentas seni siswa"', $parser->metaContent($html, 'og:title'));
        $this->assertSame('Pentas seni siswa', $parser->cleanCaptionFromOgTitle((string) $parser->metaContent($html, 'og:title')));
    }

    public function test_filter_post_images_excludes_avatars_and_recommendations(): void
    {
        $service = new InstagramScraperService;

        $rawList = [
            // Gambar postingan valid (t51.*-15)
            'https://scontent.cdninstagram.com/v/t51.82787-15/real_post_photo.jpg',
            // Foto profil author/kolaborator (-19/)
            'https://scontent.cdninstagram.com/v/t51.82787-19/author_avatar.jpg',
            // Foto profil format lain
            'https://scontent.cdninstagram.com/v/t51.2885-19/collaborator_profile_pic.jpg?stp=s150x150',
            // Duplikasi URL sama
            'https://scontent.cdninstagram.com/v/t51.82787-15/real_post_photo.jpg',
        ];

        $filtered = $service->filterPostImages($rawList);

        $this->assertCount(1, $filtered);
        $this->assertSame('https://scontent.cdninstagram.com/v/t51.82787-15/real_post_photo.jpg', $filtered[0]);
    }

    public function test_image_urls_are_limited_to_instagram_cdn_hosts(): void
    {
        $this->assertTrue(InstagramParser::isAllowedImageUrl('https://scontent.cdninstagram.com/image.jpg'));
        $this->assertTrue(InstagramParser::isAllowedImageUrl('https://cdn.example.fbcdn.net/image.jpg'));
        $this->assertFalse(InstagramParser::isAllowedImageUrl('http://scontent.cdninstagram.com/image.jpg'));
        $this->assertFalse(InstagramParser::isAllowedImageUrl('https://cdninstagram.com.evil.example/image.jpg'));
        $this->assertFalse(InstagramParser::isAllowedImageUrl('https://user@scontent.cdninstagram.com/image.jpg'));
    }
}
