<?php

namespace Tests\Unit;

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
        $this->assertNull(InstagramScraperService::extractShortcode(''));
    }

    public function test_parse_single_image_response(): void
    {
        $service = new InstagramScraperService();
        $payload = [
            'data' => [
                'caption' => ['text' => 'Kegiatan upacara hari Senin SMAN 1 Gedeg #sman1gedeg'],
                'user' => ['username' => 'sman1gedeg'],
                'taken_at' => 1725619200,
                'image_versions2' => [
                    'candidates' => [
                        ['url' => 'https://instagram.cdn/photo1.jpg'],
                    ],
                ],
            ],
        ];

        $parsed = $service->parseInstagramResponse($payload, 'DF123abc');

        $this->assertSame('DF123abc', $parsed['shortcode']);
        $this->assertStringContainsString('Kegiatan upacara', $parsed['caption']);
        $this->assertSame('sman1gedeg', $parsed['author']);
        $this->assertCount(1, $parsed['images']);
        $this->assertSame('https://instagram.cdn/photo1.jpg', $parsed['images'][0]);
    }

    public function test_parse_carousel_multi_images_response(): void
    {
        $service = new InstagramScraperService();
        $payload = [
            'data' => [
                'title' => 'Dokumentasi Gelar Karya P5',
                'owner' => ['username' => 'sman1gedeg'],
                'carousel_media' => [
                    [
                        'image_versions2' => [
                            'candidates' => [['url' => 'https://instagram.cdn/slide1.jpg']],
                        ],
                    ],
                    [
                        'image_versions2' => [
                            'candidates' => [['url' => 'https://instagram.cdn/slide2.jpg']],
                        ],
                    ],
                    [
                        'display_url' => 'https://instagram.cdn/slide3.jpg',
                    ],
                ],
            ],
        ];

        $parsed = $service->parseInstagramResponse($payload, 'CarouselCode');

        $this->assertSame('CarouselCode', $parsed['shortcode']);
        $this->assertSame('Dokumentasi Gelar Karya P5', $parsed['caption']);
        $this->assertSame('sman1gedeg', $parsed['author']);
        $this->assertCount(3, $parsed['images']);
        $this->assertSame('https://instagram.cdn/slide1.jpg', $parsed['images'][0]);
        $this->assertSame('https://instagram.cdn/slide2.jpg', $parsed['images'][1]);
        $this->assertSame('https://instagram.cdn/slide3.jpg', $parsed['images'][2]);
    }

    public function test_clean_caption_from_og_title_and_desc(): void
    {
        $service = new InstagramScraperService();

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
        $service = new InstagramScraperService();

        $sampleHtml = <<<HTML
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

    public function test_filter_post_images_excludes_avatars_and_recommendations(): void
    {
        $service = new InstagramScraperService();

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
}
