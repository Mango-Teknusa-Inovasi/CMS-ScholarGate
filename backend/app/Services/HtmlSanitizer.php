<?php

namespace App\Services;

use HTMLPurifier;
use HTMLPurifier_Config;

/**
 * Server-side HTML sanitize (HTMLPurifier) — defense-in-depth vs stored XSS.
 * Selaras dengan DOMPurify di frontend (SafeHtml).
 */
class HtmlSanitizer
{
    private ?HTMLPurifier $purifier = null;

    public function clean(?string $html): string
    {
        if ($html === null || $html === '') {
            return '';
        }

        return $this->purifier()->purify($html);
    }

    /**
     * Plain text / short fields — strip tags, trim.
     */
    public function plain(?string $text, int $max = 5000): string
    {
        if ($text === null || $text === '') {
            return '';
        }

        $clean = trim(strip_tags($text));
        if (mb_strlen($clean) > $max) {
            $clean = mb_substr($clean, 0, $max);
        }

        return $clean;
    }

    /**
     * @param  list<array{question?: mixed, answer?: mixed}>|null  $items
     * @return list<array{question: string, answer: string}>|null
     */
    public function cleanFaq(?array $items): ?array
    {
        if ($items === null) {
            return null;
        }

        $out = [];
        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }
            $q = $this->plain(isset($item['question']) ? (string) $item['question'] : '', 500);
            $a = $this->clean(isset($item['answer']) ? (string) $item['answer'] : '');
            if ($q === '' && $a === '') {
                continue;
            }
            $out[] = ['question' => $q, 'answer' => $a];
        }

        return $out;
    }

    /**
     * Profile tabs: [{ key, label, content_html }, ...]
     *
     * @param  list<array<string, mixed>>|null  $tabs
     * @return list<array<string, mixed>>|null
     */
    public function cleanTabs(?array $tabs): ?array
    {
        if ($tabs === null) {
            return null;
        }

        $out = [];
        foreach ($tabs as $tab) {
            if (! is_array($tab)) {
                continue;
            }
            if (isset($tab['content_html']) && is_string($tab['content_html'])) {
                $tab['content_html'] = $this->clean($tab['content_html']);
            }
            if (isset($tab['label']) && is_string($tab['label'])) {
                $tab['label'] = $this->plain($tab['label'], 200);
            }
            if (isset($tab['key']) && is_string($tab['key'])) {
                $tab['key'] = preg_replace('/[^a-z0-9_\-]/i', '', $tab['key']) ?: 'tab';
            }
            $out[] = $tab;
        }

        return $out;
    }

    private function purifier(): HTMLPurifier
    {
        if ($this->purifier instanceof HTMLPurifier) {
            return $this->purifier;
        }

        $config = HTMLPurifier_Config::createDefault();
        $config->set('Core.Encoding', 'UTF-8');
        // Hindari cache stale saat ubah config di dev
        $config->set('HTML.DefinitionID', 'scholargate-cms-v1');
        $config->set('HTML.DefinitionRev', 1);

        $cachePath = storage_path('app/htmlpurifier');
        if (! is_dir($cachePath)) {
            @mkdir($cachePath, 0755, true);
        }
        $config->set('Cache.SerializerPath', $cachePath);

        // Whitelist elemen yang didukung HTMLPurifier default (+ iframe aman)
        $config->set('HTML.Allowed', implode(',', [
            'p[class|style]', 'br', 'hr',
            'div[class|style]', 'span[class|style]',
            'h1[class|style]', 'h2[class|style]', 'h3[class|style]',
            'h4[class|style]', 'h5[class|style]', 'h6[class|style]',
            'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
            'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
            'a[href|title|target|rel|class]',
            'img[src|alt|width|height|class]',
            'table[class]', 'thead', 'tbody', 'tfoot', 'tr',
            'th[colspan|rowspan|scope|class]', 'td[colspan|rowspan|class]',
            'iframe[src|width|height|frameborder]',
        ]));

        $config->set('Attr.AllowedFrameTargets', ['_blank']);
        $config->set('HTML.TargetBlank', true);
        $config->set('HTML.TargetNoreferrer', true);
        $config->set('HTML.TargetNoopener', true);

        $config->set('CSS.AllowedProperties', [
            'text-align', 'color', 'background-color',
            'width', 'height', 'max-width',
            'margin-left', 'margin-right',
        ]);

        // YouTube / Vimeo embed only
        $config->set('HTML.SafeIframe', true);
        $config->set(
            'URI.SafeIframeRegexp',
            '%^(https?:)?//(www\.youtube(?:-nocookie)?\.com/embed/|player\.vimeo\.com/video/)%'
        );

        $config->set('URI.AllowedSchemes', [
            'http' => true,
            'https' => true,
            'mailto' => true,
            'tel' => true,
        ]);

        $this->purifier = new HTMLPurifier($config);

        return $this->purifier;
    }
}
