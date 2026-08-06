<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\Article;
use App\Services\SeoService;
use App\Support\Installer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Inertia page renderer — hybrid: page shell + client data via /api/v1.
 * SEO meta injected as shared props for app.blade.php + SeoHead.
 */
class PageController extends Controller
{
    public function __construct(private SeoService $seo) {}

    public function home(Request $request): Response|RedirectResponse
    {
        if ($redirect = $this->installRedirect()) {
            return $redirect;
        }

        return Inertia::render('HomePage', [
            'seo' => $this->seo->pageMeta('/'),
        ]);
    }

    public function profile(): Response
    {
        return Inertia::render('ProfilePage', [
            'seo' => $this->seo->pageMeta('/profil'),
        ]);
    }

    public function articles(Request $request): Response
    {
        return Inertia::render('ArticlesPage', [
            'seo' => $this->seo->pageMeta('/artikel'),
        ]);
    }

    public function articleShow(string $slug): Response
    {
        $article = Article::published()
            ->with(['category:id,name', 'tags:id,name', 'author:id,name'])
            ->where('slug', $slug)
            ->first();

        $seo = $article
            ? $this->seo->articleMeta($article)
            : array_merge($this->seo->pageMeta('/artikel'), [
                'title' => 'Artikel | Scholargate',
                'robots' => 'noindex,follow',
            ]);

        return Inertia::render('ArticleDetailPage', [
            'slug' => $slug,
            'params' => ['slug' => $slug],
            'seo' => $seo,
        ]);
    }

    public function articlePreview(string $token): Response
    {
        $base = $this->seo->pageMeta('/');

        return Inertia::render('ArticlePreviewPage', [
            'token' => $token,
            'params' => ['token' => $token],
            'seo' => array_merge($base, [
                'title' => 'Pratinjau draf | Scholargate',
                'description' => 'Pratinjau konten tidak dipublikasikan.',
                'canonical' => $this->seo->absoluteUrl('/preview/artikel/'.$token),
                'og_type' => 'article',
                'robots' => 'noindex,nofollow',
                'json_ld' => null,
            ]),
        ]);
    }

    public function achievements(): Response
    {
        return Inertia::render('AchievementsPage', [
            'seo' => $this->seo->pageMeta('/prestasi'),
        ]);
    }

    public function achievementShow(string $slug): Response
    {
        $item = Achievement::published()->where('slug', $slug)->first();
        $base = $this->seo->pageMeta('/prestasi');

        if ($item) {
            $desc = $item->excerpt ?: ($base['description'] ?? '');
            $seo = array_merge($base, [
                'title' => $item->title.' | '.($base['site_name'] ?? 'Scholargate'),
                'description' => \Illuminate\Support\Str::limit(strip_tags((string) $desc), 160),
                'canonical' => $this->seo->absoluteUrl('/prestasi/'.$slug),
                'og_type' => 'article',
                'og_image' => $this->seo->mediaUrl($item->cover_path) ?: ($base['og_image'] ?? null),
                'robots' => 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
            ]);
        } else {
            $seo = array_merge($base, ['robots' => 'noindex,follow']);
        }

        return Inertia::render('AchievementDetailPage', [
            'slug' => $slug,
            'params' => ['slug' => $slug],
            'seo' => $seo,
        ]);
    }

    public function extracurricular(): Response
    {
        return Inertia::render('ExtracurricularPage', [
            'seo' => $this->seo->pageMeta('/ekstrakurikuler'),
        ]);
    }

    public function downloads(): Response
    {
        return Inertia::render('DownloadsPage', [
            'seo' => $this->seo->pageMeta('/download'),
        ]);
    }

    public function privacy(): Response
    {
        return Inertia::render('LegalPage', [
            'legalKey' => 'privacy',
            'params' => ['key' => 'privacy'],
            'seo' => $this->seo->pageMeta('/kebijakan-privasi'),
        ]);
    }

    public function terms(): Response
    {
        return Inertia::render('LegalPage', [
            'legalKey' => 'terms',
            'params' => ['key' => 'terms'],
            'seo' => $this->seo->pageMeta('/syarat-ketentuan'),
        ]);
    }

    public function memberLogin(): Response
    {
        return Inertia::render('MemberLoginPage', [
            'seo' => $this->noindexSeo('Login Member | Scholargate', '/login'),
        ]);
    }

    public function memberRegister(): Response
    {
        return Inertia::render('MemberRegisterPage', [
            'seo' => $this->noindexSeo('Daftar Member | Scholargate', '/daftar'),
        ]);
    }

    public function memberAccount(): Response
    {
        return Inertia::render('MemberAccountPage', [
            'seo' => $this->noindexSeo('Akun | Scholargate', '/akun'),
        ]);
    }

    public function adminLogin(): Response
    {
        return Inertia::render('admin/AdminLoginPage', [
            'seo' => $this->noindexSeo('Login Admin | Scholargate', '/admin/login'),
        ]);
    }

    public function admin(string $page = 'DashboardPage', array $props = []): Response
    {
        return Inertia::render('admin/'.$page, array_merge([
            'seo' => $this->noindexSeo('Admin | Scholargate', '/admin'),
        ], $props));
    }

    public function adminDashboard(): Response
    {
        return $this->admin('DashboardPage');
    }

    public function adminArticles(): Response
    {
        return $this->admin('ArticlesAdminPage');
    }

    public function adminArticleNew(): Response
    {
        return $this->admin('ArticleEditorPage', [
            'params' => [],
        ]);
    }

    public function adminArticleEdit(string $id): Response
    {
        return $this->admin('ArticleEditorPage', [
            'id' => $id,
            'params' => ['id' => $id],
        ]);
    }

    public function adminWelcome(): Response
    {
        return $this->admin('WelcomeAdminPage');
    }

    public function adminProfileContent(): Response
    {
        return $this->admin('ProfileContentAdminPage');
    }

    public function adminMedia(): Response
    {
        return $this->admin('MediaLibraryPage');
    }

    public function adminMediaGuide(): Response
    {
        return $this->admin('MediaGuidePage');
    }

    public function adminUsers(): Response
    {
        return $this->admin('UsersAdminPage');
    }

    public function adminSettings(): Response
    {
        return $this->admin('SettingsAdminPage');
    }

    public function adminLegal(): Response
    {
        return $this->admin('LegalAdminPage');
    }

    public function adminBackups(): Response
    {
        return $this->admin('BackupAdminPage');
    }

    public function adminResourceList(string $resource): Response
    {
        return $this->admin('ResourceListPage', [
            'resource' => $resource,
        ]);
    }

    public function adminResourceNew(string $resource): Response
    {
        return $this->admin('ResourceEditorPage', [
            'resource' => $resource,
            'params' => [],
        ]);
    }

    public function adminResourceEdit(string $resource, string $id): Response
    {
        return $this->admin('ResourceEditorPage', [
            'resource' => $resource,
            'id' => $id,
            'params' => ['id' => $id],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function noindexSeo(string $title, string $path): array
    {
        $base = $this->seo->pageMeta('/');

        return array_merge($base, [
            'title' => $title,
            'canonical' => $this->seo->absoluteUrl($path),
            'robots' => 'noindex,nofollow',
            'json_ld' => null,
        ]);
    }

    private function installRedirect(): ?RedirectResponse
    {
        if (! Installer::isInstalled() && Installer::canInstallViaWeb()) {
            return redirect()->route('install.show');
        }

        return null;
    }
}
