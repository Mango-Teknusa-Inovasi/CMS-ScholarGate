<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class SocialAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_social_redirect_rejects_unsupported_provider(): void
    {
        $response = $this->get('/auth/unsupported/redirect');
        $response->assertRedirect('/login');
        $response->assertSessionHas('error', 'Penyedia login unsupported tidak didukung.');
    }

    public function test_social_redirect_rejects_disabled_provider(): void
    {
        Setting::setValue('auth_social_google_enabled', '0');

        $response = $this->get('/auth/google/redirect');
        $response->assertRedirect('/login');
        $response->assertSessionHas('error', 'Login dengan google sedang tidak aktif.');
    }

    public function test_social_redirect_redirects_to_provider_when_enabled(): void
    {
        Setting::setValue('auth_social_google_enabled', '1');
        Setting::setValue('auth_social_google_client_id', 'dummy-client-id');
        Setting::setValue('auth_social_google_client_secret', 'dummy-client-secret');

        $providerMock = \Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $providerMock->shouldReceive('redirect')->once()->andReturn(redirect('https://accounts.google.com/o/oauth2/auth'));

        Socialite::shouldReceive('driver')->with('google')->andReturn($providerMock);

        $response = $this->get('/auth/google/redirect?intent=admin');
        $response->assertRedirect('https://accounts.google.com/o/oauth2/auth');
        $this->assertEquals('admin', session('social_auth_intent'));
    }

    public function test_social_callback_creates_and_logs_in_user(): void
    {
        Setting::setValue('auth_social_google_enabled', '1');
        Setting::setValue('auth_social_google_client_id', 'dummy-client-id');
        Setting::setValue('auth_social_google_client_secret', 'dummy-client-secret');

        $socialUser = new SocialiteUser;
        $socialUser->id = 'google-uid-12345';
        $socialUser->name = 'Budi Santoso';
        $socialUser->email = 'budi@sekolah.sch.id';
        $socialUser->avatar = 'https://lh3.googleusercontent.com/avatar.jpg';

        $providerMock = \Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $providerMock->shouldReceive('user')->once()->andReturn($socialUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($providerMock);

        $response = $this->get('/auth/google/callback');
        $response->assertRedirect('/');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'budi@sekolah.sch.id',
            'provider' => 'google',
            'provider_id' => 'google-uid-12345',
        ]);
    }

    public function test_public_settings_exposes_social_buttons_and_widgets_without_secrets(): void
    {
        Setting::setValue('widget_search_enabled', '1');
        Setting::setValue('widget_announcement_title', 'Pusat Info Sekolah');
        Setting::setValue('auth_social_google_enabled', '1');
        Setting::setValue('auth_social_google_button_text', 'Masuk via Akun Sekolah');
        Setting::setValue('auth_social_google_client_id', 'super-secret-client-id');
        Setting::setValue('auth_social_google_client_secret', 'super-secret-client-secret');

        $response = $this->getJson('/api/v1/settings/public');
        $response->assertOk();

        // Must be visible
        $response->assertJsonPath('widget_search_enabled', '1');
        $response->assertJsonPath('widget_announcement_title', 'Pusat Info Sekolah');
        $response->assertJsonPath('auth_social_google_enabled', '1');
        $response->assertJsonPath('auth_social_google_button_text', 'Masuk via Akun Sekolah');

        // MUST NOT be exposed
        $this->assertArrayNotHasKey('auth_social_google_client_secret', $response->json());
        $this->assertArrayNotHasKey('auth_social_google_client_id', $response->json());
    }
}
