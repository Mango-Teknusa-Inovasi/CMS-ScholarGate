<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use App\Models\User;
use App\Services\BrandLogoService;
use App\Services\Plugin\HookManager;
use App\Services\Ppid\Access;
use App\Services\Ppid\Settings;
use App\Services\Theme\ThemeManager;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $token = null;
        if ($user && $user->isAdmin()) {
            $token = $request->session()->get('admin_spa_token');
            if (! $token) {
                $token = $user->createToken('admin-spa')->plainTextToken;
                $request->session()->put('admin_spa_token', $token);
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $this->userPayload($user),
                'token' => $token,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'app' => [
                'name' => Setting::getValue('site_name') ?: config('app.name', 'Portal Resmi'),
                'url' => config('app.url'),
                'logo_url' => BrandLogoService::brandUrls()['logo'] ?? null,
                'tagline' => Setting::getValue('site_tagline') ?: Setting::getValue('site_subtitle') ?: '',
                'email' => Setting::getValue('contact_email') ?: Setting::getValue('site_email') ?: '',
                'phone' => Setting::getValue('contact_phone') ?: Setting::getValue('site_phone') ?: '',
                'address' => Setting::getValue('contact_address') ?: Setting::getValue('site_address') ?: '',
            ],
            'ppid_enabled' => fn () => Settings::get()['enabled'],
            'active_theme' => fn () => app(ThemeManager::class)->getActiveTheme(),
            'hooks' => fn () => app(HookManager::class)->getRegisteredHooks(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function userPayload(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'gravatar_url' => $user->gravatar_url,
            'is_admin' => $user->isAdmin(),
            'ppid_access' => Access::staff($user),
            'is_super_admin' => $user->isSuperAdmin(),
        ];
    }
}
