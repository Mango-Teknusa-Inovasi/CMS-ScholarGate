<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /** Supported standard socialite drivers */
    private const SUPPORTED_DRIVERS = ['google', 'github', 'facebook'];

    /**
     * Redirect to the provider's OAuth / OIDC authorization page.
     */
    public function redirect(Request $request, string $provider): RedirectResponse
    {
        $provider = strtolower(trim($provider));
        $intent = $request->query('intent', 'member'); // 'admin' or 'member'
        session(['social_auth_intent' => $intent]);

        // 1. Generic OIDC Flow
        if ($provider === 'oidc') {
            return $this->redirectOidc($request);
        }

        // 2. Standard Socialite Flow (google, github, facebook)
        if (! in_array($provider, self::SUPPORTED_DRIVERS, true)) {
            return $this->redirectWithError($intent, "Penyedia login {$provider} tidak didukung.");
        }

        $enabled = Setting::getValue("auth_social_{$provider}_enabled") ?? config("services.{$provider}.enabled", false);
        if (! $enabled && $enabled !== '1' && $enabled !== true) {
            return $this->redirectWithError($intent, "Login dengan {$provider} sedang tidak aktif.");
        }

        $this->configureSocialiteDriver($provider);

        try {
            return Socialite::driver($provider)->redirect();
        } catch (\Throwable $e) {
            Log::error("Socialite redirect error [{$provider}]: ".$e->getMessage());

            return $this->redirectWithError($intent, "Gagal menginisiasi login {$provider}: ".$e->getMessage());
        }
    }

    /**
     * Handle the provider's OAuth / OIDC callback.
     */
    public function callback(Request $request, string $provider): RedirectResponse
    {
        $provider = strtolower(trim($provider));
        $intent = session('social_auth_intent', 'member');

        if ($request->has('error')) {
            $errorDesc = $request->get('error_description', $request->get('error'));

            return $this->redirectWithError($intent, 'Login dibatalkan atau ditolak: '.$errorDesc);
        }

        // 1. Handle Generic OIDC Callback
        if ($provider === 'oidc') {
            return $this->handleOidcCallback($request, $intent);
        }

        // 2. Handle Standard Socialite Callback
        if (! in_array($provider, self::SUPPORTED_DRIVERS, true)) {
            return $this->redirectWithError($intent, "Penyedia login {$provider} tidak didukung.");
        }

        $this->configureSocialiteDriver($provider);

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Throwable $e) {
            Log::error("Socialite callback error [{$provider}]: ".$e->getMessage());

            return $this->redirectWithError($intent, 'Gagal mengambil data akun dari penyedia login.');
        }

        return $this->loginOrCreateUser([
            'provider' => $provider,
            'provider_id' => $socialUser->getId(),
            'name' => $socialUser->getName() ?: $socialUser->getNickname() ?: 'User',
            'email' => $socialUser->getEmail(),
            'avatar' => $socialUser->getAvatar(),
        ], $intent);
    }

    /**
     * Redirect to Generic OIDC provider authorization URL.
     */
    private function redirectOidc(Request $request): RedirectResponse
    {
        $enabled = Setting::getValue('auth_social_oidc_enabled');
        if (! $enabled || $enabled === '0') {
            return $this->redirectWithError('member', 'Login SSO OIDC sedang tidak aktif.');
        }

        $clientId = Setting::getValue('auth_social_oidc_client_id');
        $authUrl = Setting::getValue('auth_social_oidc_auth_url');
        $baseUrl = rtrim((string) Setting::getValue('auth_social_oidc_base_url'), '/');

        if (! $authUrl && $baseUrl) {
            $authUrl = $baseUrl.'/protocol/openid-connect/auth';
        }

        if (! $clientId || ! $authUrl) {
            return $this->redirectWithError('member', 'Konfigurasi SSO OIDC belum lengkap di Admin Settings.');
        }

        $state = Str::random(40);
        session(['oidc_auth_state' => $state]);

        $redirectUri = route('social.callback', ['provider' => 'oidc']);

        $params = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid profile email',
            'state' => $state,
        ]);

        $fullUrl = $authUrl.(str_contains($authUrl, '?') ? '&' : '?').$params;

        return redirect()->away($fullUrl);
    }

    /**
     * Handle Generic OIDC authorization code exchange and userinfo.
     */
    private function handleOidcCallback(Request $request, string $intent): RedirectResponse
    {
        $code = $request->query('code');
        $state = $request->query('state');
        $savedState = session('oidc_auth_state');

        if (! $code || ! $state || $state !== $savedState) {
            return $this->redirectWithError($intent, 'Sesi autentikasi OIDC tidak valid atau kedaluwarsa.');
        }

        $clientId = Setting::getValue('auth_social_oidc_client_id');
        $clientSecret = Setting::getValue('auth_social_oidc_client_secret');
        $tokenUrl = Setting::getValue('auth_social_oidc_token_url');
        $userinfoUrl = Setting::getValue('auth_social_oidc_userinfo_url');
        $baseUrl = rtrim((string) Setting::getValue('auth_social_oidc_base_url'), '/');

        if (! $tokenUrl && $baseUrl) {
            $tokenUrl = $baseUrl.'/protocol/openid-connect/token';
        }
        if (! $userinfoUrl && $baseUrl) {
            $userinfoUrl = $baseUrl.'/protocol/openid-connect/userinfo';
        }

        if (! $clientId || ! $clientSecret || ! $tokenUrl) {
            return $this->redirectWithError($intent, 'Konfigurasi endpoint token OIDC belum lengkap.');
        }

        $redirectUri = route('social.callback', ['provider' => 'oidc']);

        // Exchange code for token
        try {
            $tokenRes = Http::asForm()->timeout(15)->post($tokenUrl, [
                'grant_type' => 'authorization_code',
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'code' => $code,
                'redirect_uri' => $redirectUri,
            ]);

            if (! $tokenRes->successful()) {
                Log::error('OIDC token exchange failed', ['status' => $tokenRes->status(), 'body' => $tokenRes->body()]);

                return $this->redirectWithError($intent, 'Gagal menukar token otorisasi SSO OIDC.');
            }

            $tokenData = $tokenRes->json();
            $accessToken = $tokenData['access_token'] ?? null;
            if (! $accessToken) {
                return $this->redirectWithError($intent, 'Respon token OIDC tidak memiliki access_token.');
            }

            // Fetch user info
            $userinfoRes = Http::withToken($accessToken)->timeout(15)->get($userinfoUrl ?: $baseUrl.'/userinfo');
            if (! $userinfoRes->successful()) {
                Log::error('OIDC userinfo fetch failed', ['status' => $userinfoRes->status(), 'body' => $userinfoRes->body()]);

                return $this->redirectWithError($intent, 'Gagal mengambil informasi profil dari SSO OIDC.');
            }

            $userData = $userinfoRes->json();
            $sub = $userData['sub'] ?? $userData['id'] ?? null;
            $email = $userData['email'] ?? null;
            $name = $userData['name'] ?? $userData['preferred_username'] ?? 'SSO User';
            $avatar = $userData['picture'] ?? null;

            return $this->loginOrCreateUser([
                'provider' => 'oidc',
                'provider_id' => (string) $sub,
                'name' => (string) $name,
                'email' => (string) $email,
                'avatar' => $avatar ? (string) $avatar : null,
            ], $intent);
        } catch (\Throwable $e) {
            Log::error('OIDC processing error: '.$e->getMessage());

            return $this->redirectWithError($intent, 'Terjadi kendala saat komunikasi dengan SSO OIDC.');
        }
    }

    /**
     * Match existing user or create a new user and log in.
     *
     * @param  array{provider: string, provider_id: string, name: string, email: ?string, avatar: ?string}  $data
     */
    private function loginOrCreateUser(array $data, string $intent): RedirectResponse
    {
        if (empty($data['email'])) {
            return $this->redirectWithError($intent, 'Akun pihak ketiga tidak memberikan alamat email yang valid.');
        }

        // 1. Search by provider and provider_id
        $user = User::query()
            ->where('provider', $data['provider'])
            ->where('provider_id', $data['provider_id'])
            ->first();

        // 2. Search by email if not found
        if (! $user) {
            $user = User::query()->where('email', $data['email'])->first();
        }

        if ($user) {
            // Update provider info if not yet associated
            $updates = [];
            if (! $user->provider) {
                $updates['provider'] = $data['provider'];
                $updates['provider_id'] = $data['provider_id'];
            }
            if (! $user->avatar && $data['avatar']) {
                $updates['avatar'] = $data['avatar'];
            }
            if ($updates) {
                $user->update($updates);
            }
        } else {
            // Create new member user
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => null,
                'role' => 'member',
                'provider' => $data['provider'],
                'provider_id' => $data['provider_id'],
                'avatar' => $data['avatar'],
                'email_verified_at' => now(),
            ]);
        }

        // If intent was admin, but user is not admin
        if ($intent === 'admin' && ! $user->isAdmin()) {
            return $this->redirectWithError('admin', 'Akun ini terdaftar sebagai Member, tetapi tidak memiliki izin akses panel Admin CMS.');
        }

        // Establish session login
        Auth::login($user, true);
        request()->session()->regenerate();
        request()->session()->save();

        if ($user->isAdmin()) {
            return redirect()->intended('/admin');
        }

        return redirect()->intended('/');
    }

    /**
     * Dynamically inject Socialite configuration from database settings or .env.
     */
    private function configureSocialiteDriver(string $provider): void
    {
        $clientId = Setting::getValue("auth_social_{$provider}_client_id")
            ?: config("services.{$provider}.client_id");
        $clientSecret = Setting::getValue("auth_social_{$provider}_client_secret")
            ?: config("services.{$provider}.client_secret");

        Config::set("services.{$provider}", [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'redirect' => route('social.callback', ['provider' => $provider]),
        ]);
    }

    /**
     * Redirect to appropriate login page with error flash message.
     */
    private function redirectWithError(string $intent, string $message): RedirectResponse
    {
        $target = ($intent === 'admin') ? '/admin/login' : '/login';

        return redirect($target)->with('error', $message);
    }
}
