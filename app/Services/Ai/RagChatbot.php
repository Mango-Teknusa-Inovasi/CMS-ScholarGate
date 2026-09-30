<?php

namespace App\Services\Ai;

use App\Models\Article;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RagChatbot
{
    /**
     * Menjawab pertanyaan publik via RAG (Retrieval-Augmented Generation) & profil sekolah.
     */
    public function answerRagQuery(string $query, array $history = []): array
    {
        $displayModel = AiClient::getDisplayModelName();
        $personaRules = AiClient::buildAssistantPersonaRules($displayModel);

        $filterResult = AiClient::filterPromptInjection($query);
        $cleanQuery = $filterResult['sanitized_text'];
        $isFlagged = $filterResult['is_flagged'];

        $schoolName = (string) Setting::getValue('site_name', config('app.name', 'Portal Sekolah'));
        $knowledgeContext = $this->buildSchoolKnowledgeContext($cleanQuery);

        $systemPrompt = <<<PROMPT
{$personaRules}

Anda adalah asisten virtual resmi untuk {$schoolName}.
Tugas Anda: Menjawab pertanyaan pengunjung portal (siswa, orang tua, alumni, publik) mengenai informasi sekolah, kegiatan, pengumuman, dan prestasi berdasarkan data kontekstual resmi yang disediakan di bawah ini.

[PANDUAN JAWABAN]:
1. Utamakan informasi dari konteks resmi sekolah di bawah ini.
2. Jawab dengan ramah, berwibawa, jelas, dan informatif.
3. Jika informasi tidak terdapat pada konteks, jawab dengan jujur dan sarankan pengunjung untuk menghubungi pihak sekolah atau memeriksa menu portal terkait.
4. Jangan membuat-buat informasi fiktif di luar data sekolah.

[KONTEKS RESMI SEKOLAH]:
{$knowledgeContext['context_text']}
PROMPT;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        foreach (array_slice($history, -4) as $h) {
            if (! empty($h['user'])) {
                $messages[] = ['role' => 'user', 'content' => (string) $h['user']];
            }
            if (! empty($h['assistant'])) {
                $messages[] = ['role' => 'assistant', 'content' => (string) $h['assistant']];
            }
        }

        $messages[] = ['role' => 'user', 'content' => "<untrusted_user_query>\n{$cleanQuery}\n</untrusted_user_query>"];

        $answer = AiClient::callOpenAiApi($messages, 0.5);

        return [
            'query' => $cleanQuery,
            'answer' => $answer,
            'sources' => $knowledgeContext['sources'],
            'model_name' => $displayModel,
            'flagged' => $isFlagged,
        ];
    }

    /**
     * Membangun konteks RAG berdasarkan pencarian artikel & profil sekolah.
     */
    public function buildSchoolKnowledgeContext(string $query): array
    {
        $schoolName = (string) Setting::getValue('site_name', config('app.name', 'Portal Sekolah'));
        $tagline = (string) Setting::getValue('site_tagline', '');
        $description = (string) Setting::getValue('site_description', '');

        $contextText = "Nama Sekolah: {$schoolName}\n";
        if ($tagline !== '') {
            $contextText .= "Tagline: {$tagline}\n";
        }
        if ($description !== '') {
            $contextText .= "Deskripsi: {$description}\n";
        }

        $sources = [];

        // Retrival artikel berita & prestasi terkait query
        $keywords = array_filter(explode(' ', preg_replace('/[^\w\s]/u', '', $query)), fn ($w) => mb_strlen($w) > 3);

        $articlesQuery = Article::query()->where('status', 'published');
        if (! empty($keywords)) {
            $articlesQuery->where(function ($q) use ($keywords) {
                foreach ($keywords as $kw) {
                    $q->orWhere('title', 'like', "%{$kw}%")
                      ->orWhere('body', 'like', "%{$kw}%");
                }
            });
        }

        $articles = $articlesQuery->orderBy('published_at', 'desc')->take(4)->get();

        if ($articles->isNotEmpty()) {
            $contextText .= "\n--- DOKUMEN & ARTIKEL BERITA RESMI TERKAIT ---\n";
            foreach ($articles as $art) {
                $plainBody = Str_limit_words(strip_tags($art->body ?? ''), 120);
                $contextText .= "Judul: {$art->title}\n";
                $contextText .= "Ringkasan: {$plainBody}\n---\n";

                $sources[] = [
                    'id' => $art->id,
                    'title' => $art->title,
                    'slug' => $art->slug,
                    'url' => "/artikel/{$art->slug}",
                ];
            }
        }

        return [
            'context_text' => $contextText,
            'sources' => $sources,
        ];
    }
}

function Str_limit_words(string $text, int $words = 100): string
{
    $text = preg_replace('/\s+/', ' ', trim($text));
    $parts = explode(' ', $text);
    if (count($parts) <= $words) {
        return $text;
    }
    return implode(' ', array_slice($parts, 0, $words)).'...';
}
