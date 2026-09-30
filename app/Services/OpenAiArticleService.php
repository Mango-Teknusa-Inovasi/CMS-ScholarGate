<?php

namespace App\Services;

use App\Services\Ai\AchievementGenerator;
use App\Services\Ai\AiClient;
use App\Services\Ai\ArticleGenerator;
use App\Services\Ai\RagChatbot;
use App\Services\Ai\SpeechGenerator;

/**
 * Service Facade untuk seluruh fungsionalitas Kecerdasan Buatan (AI) ScholarGate.
 * Berfungsi sebagai titik akses terpadu yang mendelegasikan eksekusi ke modul-modul terpisah:
 * - AiClient: Koneksi API, masking model & filter prompt injection
 * - ArticleGenerator: Pembuat berita otomatis & AI Copilot editor
 * - SpeechGenerator: Pembuat sambutan pejabat & konten profil sekolah
 * - AchievementGenerator: Pembuat liputan kejuaraan & prestasi
 * - RagChatbot: Chatbot RAG berbasis basis pengetahuan dokumen sekolah
 */
class OpenAiArticleService
{
    protected ArticleGenerator $articleGenerator;
    protected SpeechGenerator $speechGenerator;
    protected AchievementGenerator $achievementGenerator;
    protected RagChatbot $ragChatbot;

    public function __construct(
        ?ArticleGenerator $articleGenerator = null,
        ?SpeechGenerator $speechGenerator = null,
        ?AchievementGenerator $achievementGenerator = null,
        ?RagChatbot $ragChatbot = null
    ) {
        $this->articleGenerator = $articleGenerator ?? new ArticleGenerator();
        $this->speechGenerator = $speechGenerator ?? new SpeechGenerator();
        $this->achievementGenerator = $achievementGenerator ?? new AchievementGenerator();
        $this->ragChatbot = $ragChatbot ?? new RagChatbot();
    }

    public static function getDisplayModelName(): string
    {
        return AiClient::getDisplayModelName();
    }

    public static function buildAssistantPersonaRules(?string $displayModelName = null): string
    {
        return AiClient::buildAssistantPersonaRules($displayModelName);
    }

    public static function filterPromptInjection(string $text): array
    {
        return AiClient::filterPromptInjection($text);
    }

    public function testConnection(?string $apiKey = null, ?string $model = null, ?string $baseUrl = null): array
    {
        return (new AiClient())->testConnection($apiKey, $model, $baseUrl);
    }

    public function generateArticle(array $context): array
    {
        return $this->articleGenerator->generateArticle($context);
    }

    public function generateArticleFromPrompt(array|string $params, ?string $categoryName = null): array
    {
        if (is_string($params)) {
            $params = ['topic' => $params, 'category_hint' => $categoryName];
        }
        return $this->articleGenerator->generateArticle([
            'caption' => $params['topic'] ?? '',
            'tone' => $params['tone'] ?? 'formal_news',
            'author' => 'AI Generator',
            'image_count' => 1,
        ]);
    }

    public function copilotEdit(string $action, string $selectedText, string $fullContext = '', array $extra = []): string
    {
        return $this->articleGenerator->copilotEdit($action, $selectedText, $fullContext, $extra);
    }

    public function generateWelcomeSpeech(array $params): array
    {
        return $this->speechGenerator->generateWelcomeSpeech($params);
    }

    public function generateWelcomeMessage(array $params): array
    {
        return $this->speechGenerator->generateWelcomeSpeech([
            'speaker_name' => $params['speaker'] ?? 'Kepala Sekolah',
            'speaker_title' => 'Kepala Sekolah',
            'tone' => $params['tone'] ?? 'warm',
            'key_points' => $params['theme'] ?? '',
        ]);
    }

    public function generateProfileTab(array $params): array
    {
        return $this->speechGenerator->generateProfileTab($params);
    }

    public function generateProfileSection(array $params): array
    {
        return $this->speechGenerator->generateProfileTab([
            'tab_key' => $params['tab_label'] ?? 'overview',
            'prompt' => $params['hints'] ?? '',
        ]);
    }

    public function generateAchievementArticle(array $params): array
    {
        return $this->achievementGenerator->generateAchievementReport($params);
    }

    public function generateAchievementReport(array $params): array
    {
        return $this->achievementGenerator->generateAchievementReport($params);
    }

    public function assistText(array $params): array
    {
        $result = $this->articleGenerator->copilotEdit(
            $params['action'] ?? 'polish',
            $params['text'] ?? '',
            $params['prompt'] ?? '',
            $params
        );
        return [
            'result_html' => $result,
            'action' => $params['action'] ?? 'polish',
        ];
    }

    public function answerRagQuery(string $query, array|int $history = [], array $options = []): array
    {
        if (is_int($history)) {
            $history = [];
        }
        return $this->ragChatbot->answerRagQuery($query, $history);
    }
}
