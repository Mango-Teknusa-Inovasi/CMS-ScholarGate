<?php

namespace App\Services\Instagram;

class InstagramParser
{
    /**
     * Ekstrak shortcode dari link postingan / reel / tv Instagram.
     */
    public static function extractShortcode(string $url): ?string
    {
        $url = trim($url);
        if ($url === '') {
            return null;
        }

        if (preg_match('#instagram\.com/(?:p|reel|tv)/([A-Za-z0-9_-]+)#i', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Bersihkan caption dari og:title ("User on/di Instagram: \"...\"").
     */
    public function cleanCaptionFromOgTitle(string $rawTitle): string
    {
        $decoded = html_entity_decode($rawTitle, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        if (preg_match('/(?:on|di)\s+Instagram:\s*["\']?(.*?)["\']?\s*$/isu', $decoded, $matches)) {
            $inner = trim($matches[1]);
            if ($inner !== '') {
                return $inner;
            }
        }

        return trim($decoded);
    }

    /**
     * Bersihkan caption dari og:description ("45 likes, 3 comments - user on Date: \"...\"").
     */
    public function cleanCaptionFromOgDesc(string $rawDesc): string
    {
        $decoded = html_entity_decode($rawDesc, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        if (preg_match('/:\s*["\'](.*?)["\']?\s*$/isu', $decoded, $matches)) {
            $inner = trim($matches[1]);
            if ($inner !== '') {
                return $inner;
            }
        }

        return trim($decoded);
    }

    /**
     * Filter ketat untuk membersihkan daftar gambar:
     * - Mengeliminasi foto profil (-19/, profile_pic, avatar, s150x150, dll)
     * - Mengeliminasi aset statis / icon Meta
     * - Menghilangkan duplikasi berdasarkan unik ID slide gambar
     *
     * @param  array<string>  $images
     * @return array<string>
     */
    public function filterPostImages(array $images): array
    {
        $filtered = [];
        $seenKeys = [];

        foreach ($images as $url) {
            $trimmed = trim((string) $url);
            if (! filter_var($trimmed, FILTER_VALIDATE_URL)) {
                continue;
            }

            if (preg_match('#(/t51\.[0-9]+-19/|/s150x150/|/s320x320/|/s100x100/|150_n\.|profile_pic|rsrc\.php|static\.cdninstagram|avatar|emoji)#i', $trimmed)) {
                continue;
            }

            $path = (string) parse_url($trimmed, PHP_URL_PATH);
            $base = basename($path);

            if (preg_match('/([0-9]{8,}_[0-9]{8,})/', $base, $mId)) {
                $key = $mId[1];
            } else {
                $key = strtok($base, '?');
            }

            if ($key !== '' && ! isset($seenKeys[$key])) {
                $seenKeys[$key] = true;
                $filtered[] = $trimmed;
            }
        }

        return $filtered;
    }

    /**
     * Ekstrak gambar utama dan slide carousel dari OpenGraph dan Twitter tags.
     * HANYA melakukan regex fallback CDN jika meta tag og:image/twitter:image tidak tersedia,
     * untuk mencegah terambilnya foto postingan rekomendasi/footer dari postingan lain.
     *
     * @return array<string>
     */
    public function extractImagesFromHtml(string $html): array
    {
        $images = [];

        if (preg_match_all('/<meta property="og:image" content="([^"]+)"/i', $html, $mOgImg)) {
            foreach ($mOgImg[1] as $raw) {
                $images[] = html_entity_decode($raw, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
        }

        if (preg_match('/<meta name="twitter:image" content="([^"]+)"/i', $html, $mTwImg)) {
            $images[] = html_entity_decode($mTwImg[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        // HANYA jika meta tag og:image & twitter:image kosong, lakukan fallback CDN
        if (empty($images)) {
            $unescaped = str_replace('\/', '/', $html);
            if (preg_match_all('#https://[a-zA-Z0-9.-]*(?:cdninstagram\.com|fbcdn\.net)/[^\s"\'<>]+#i', $unescaped, $mCdn)) {
                foreach ($mCdn[0] as $cdnUrl) {
                    $images[] = html_entity_decode($cdnUrl, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                }
            }
        }

        return $this->filterPostImages($images);
    }

    /**
     * Cari objek data media spesifik untuk $shortcode di dalam script JSON SSR.
     */
    public function findTargetMediaInJson(string $html, string $shortcode): ?array
    {
        if (! preg_match_all('/<script[^>]*>(.*?)<\/script>/is', $html, $scripts)) {
            return null;
        }

        foreach ($scripts[1] as $s) {
            if (! str_contains($s, $shortcode) || ! str_contains($s, '{')) {
                continue;
            }

            $json = json_decode($s, true);

            if (! is_array($json)) {
                if (preg_match('/(?:window\.__additionalDataLoaded\(.*?\s*,\s*|window\._sharedData\s*=\s*|\=\s*)(\{.*?\});?/s', $s, $mJson)) {
                    $json = json_decode($mJson[1], true);
                }
            }

            if (! is_array($json)) {
                if (preg_match_all('/(\{(?:[^{}]|(?R))*\})/s', $s, $mBlocks)) {
                    foreach ($mBlocks[1] as $block) {
                        if (! str_contains($block, $shortcode)) {
                            continue;
                        }
                        $decoded = json_decode($block, true);
                        if (is_array($decoded)) {
                            $found = $this->searchMediaRecursive($decoded, $shortcode);
                            if ($found) {
                                return $found;
                            }
                        }
                    }
                }
                continue;
            }

            $found = $this->searchMediaRecursive($json, $shortcode);
            if ($found) {
                return $found;
            }
        }

        return null;
    }

    private function searchMediaRecursive(array $obj, string $shortcode): ?array
    {
        if ((isset($obj['code']) && $obj['code'] === $shortcode) || (isset($obj['shortcode']) && $obj['shortcode'] === $shortcode)) {
            if (isset($obj['image_versions2']) || isset($obj['if_not_gated_logged_out']) || isset($obj['carousel_media']) || isset($obj['edge_sidecar_to_children']) || isset($obj['video_versions']) || isset($obj['display_url'])) {
                return $obj;
            }
        }

        foreach ($obj as $val) {
            if (is_array($val)) {
                $res = $this->searchMediaRecursive($val, $shortcode);
                if ($res) {
                    return $res;
                }
            }
        }

        return null;
    }

    /**
     * Parsing struktur JSON beragam dari penyedia scraper Instagram.
     */
    public function parseInstagramResponse(array $data, string $shortcode): array
    {
        $payload = $data['data'] ?? $data['items'][0] ?? $data['graphql']['shortcode_media'] ?? $data;

        $caption = '';
        if (isset($payload['caption'])) {
            $caption = is_array($payload['caption'])
                ? ($payload['caption']['text'] ?? '')
                : (string) $payload['caption'];
        } elseif (! empty($payload['edge_media_to_caption']['edges'][0]['node']['text'])) {
            $caption = (string) $payload['edge_media_to_caption']['edges'][0]['node']['text'];
        } elseif (! empty($payload['title'])) {
            $caption = (string) $payload['title'];
        } elseif (! empty($payload['description'])) {
            $caption = (string) $payload['description'];
        }

        $author = null;
        if (! empty($payload['user']['username'])) {
            $author = (string) $payload['user']['username'];
        } elseif (! empty($payload['owner']['username'])) {
            $author = (string) $payload['owner']['username'];
        } elseif (! empty($payload['author_name'])) {
            $author = (string) $payload['author_name'];
        }

        $takenAt = null;
        $timestamp = $payload['taken_at'] ?? $payload['taken_at_timestamp'] ?? $payload['created_time'] ?? null;
        if ($timestamp && is_numeric($timestamp)) {
            $takenAt = date('Y-m-d H:i:s', (int) $timestamp);
        }

        $images = [];

        if (! empty($payload['carousel_media']) && is_array($payload['carousel_media'])) {
            foreach ($payload['carousel_media'] as $item) {
                $img = $this->extractBestImageFromItem($item);
                if ($img) {
                    $images[] = $img;
                }
            }
        } elseif (! empty($payload['edge_sidecar_to_children']['edges']) && is_array($payload['edge_sidecar_to_children']['edges'])) {
            foreach ($payload['edge_sidecar_to_children']['edges'] as $edge) {
                $node = $edge['node'] ?? [];
                $img = $this->extractBestImageFromItem($node);
                if ($img) {
                    $images[] = $img;
                }
            }
        } elseif (! empty($payload['images']) && is_array($payload['images'])) {
            foreach ($payload['images'] as $imgItem) {
                if (is_string($imgItem)) {
                    $images[] = $imgItem;
                } elseif (is_array($imgItem)) {
                    $best = $this->extractBestImageFromItem($imgItem);
                    if ($best) {
                        $images[] = $best;
                    }
                }
            }
        }

        if (empty($images)) {
            $singleImg = $this->extractBestImageFromItem($payload);
            if ($singleImg) {
                $images[] = $singleImg;
            }
        }

        $filteredImages = [];
        foreach ($images as $imgUrl) {
            $trimmed = trim((string) $imgUrl);
            if (filter_var($trimmed, FILTER_VALIDATE_URL) && ! in_array($trimmed, $filteredImages, true)) {
                $filteredImages[] = $trimmed;
            }
        }

        return [
            'shortcode' => $shortcode,
            'caption' => trim($caption),
            'author' => $author,
            'taken_at' => $takenAt,
            'images' => $filteredImages,
        ];
    }

    /**
     * Ambil URL gambar resolusi terbaik dari sebuah node media item.
     */
    public function extractBestImageFromItem(array $item): ?string
    {
        if (! empty($item['image_versions2']['candidates']) && is_array($item['image_versions2']['candidates'])) {
            return (string) ($item['image_versions2']['candidates'][0]['url'] ?? null);
        }

        if (! empty($item['display_url'])) {
            return (string) $item['display_url'];
        }

        if (! empty($item['display_resources']) && is_array($item['display_resources'])) {
            $last = end($item['display_resources']);
            if (! empty($last['src'])) {
                return (string) $last['src'];
            }
        }

        if (! empty($item['thumbnail_url'])) {
            return (string) $item['thumbnail_url'];
        }
        if (! empty($item['image_url'])) {
            return (string) $item['image_url'];
        }
        if (! empty($item['url']) && is_string($item['url'])) {
            return (string) $item['url'];
        }

        return null;
    }
}
