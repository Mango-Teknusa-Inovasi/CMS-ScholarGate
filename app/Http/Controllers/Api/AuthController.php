<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login member area (portal publik) — session web + optional Sanctum token.
     */
    public function loginMember(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $credentials['email'])->first();
        if (! $user || ! Hash::check($credentials['password'], $user->getRawOriginal('password') ?: '')) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password tidak valid.'],
            ]);
        }

        Auth::login($user, true);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        // Optional token for non-browser clients
        $user->tokens()->where('name', 'member-spa')->delete();
        $token = $user->createToken('member-spa')->plainTextToken;

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
            'message' => 'Login member berhasil',
        ]);
    }

    /**
     * Login panel CMS admin — session web + optional Sanctum token.
     */
    public function loginAdmin(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $credentials['email'])->first();
        if (! $user || ! Hash::check($credentials['password'], (string) $user->getRawOriginal('password'))) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password tidak valid.'],
            ]);
        }

        if (! $user->isAdmin()) {
            throw ValidationException::withMessages([
                'email' => ['Akun ini tidak punya akses admin CMS. Gunakan /login untuk member.'],
            ]);
        }

        Auth::login($user, true);
        if ($request->hasSession()) {
            $request->session()->regenerate();
            $request->session()->save();
        }

        $user->tokens()->where('name', 'admin-spa')->delete();
        $token = $user->createToken('admin-spa')->plainTextToken;

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
            'message' => 'Login admin berhasil',
        ]);
    }

    /** @deprecated gunakan loginMember / loginAdmin */
    public function login(Request $request): JsonResponse
    {
        return $this->loginAdmin($request);
    }

    public function logout(Request $request): JsonResponse
    {
        // Bearer token (if any)
        $token = $request->user()?->currentAccessToken();
        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        // Session logout for Inertia monolith (when session middleware is present)
        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logout berhasil']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    /**
     * Daftar member sederhana (opsional).
     */
    public function registerMember(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ]);

        // password cast 'hashed' di model — jangan Hash::make lagi (double-hash)
        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'member',
        ]);

        Auth::login($user, true);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $token = $user->createToken('member-spa')->plainTextToken;

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
            'message' => 'Registrasi berhasil',
        ], 201);
    }

    /**
     * Update profil identitas user (nama, email).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        return response()->json([
            'user' => $this->userPayload($user->fresh()),
            'message' => 'Profil berhasil diperbarui.',
        ]);
    }

    /**
     * Ganti password user aktif.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($data['current_password'], (string) $user->getRawOriginal('password'))) {
            throw ValidationException::withMessages([
                'current_password' => ['Password saat ini salah.'],
            ]);
        }

        $user->update([
            'password' => $data['password'],
        ]);

        return response()->json([
            'message' => 'Password berhasil diperbarui.',
        ]);
    }

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
            'is_super_admin' => $user->isSuperAdmin(),
        ];
    }
}
