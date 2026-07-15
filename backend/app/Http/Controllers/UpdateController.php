<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Installer;
use App\Support\Updater;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

/**
 * Easy update: ganti file di server → buka /update → login admin → migrate.
 */
class UpdateController extends Controller
{
    public function show(): View|RedirectResponse
    {
        if (! Installer::isInstalled()) {
            return redirect()->route('install.show');
        }

        $status = Updater::status();

        return view('update', [
            'status' => $status,
            'result' => session('update_result'),
        ]);
    }

    public function store(Request $request): RedirectResponse|View
    {
        if (! Installer::isInstalled()) {
            return redirect()->route('install.show');
        }

        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'optimize' => ['nullable', 'boolean'],
            'confirm' => ['accepted'],
        ], [
            'confirm.accepted' => 'Centang konfirmasi untuk menjalankan update.',
        ]);

        $user = User::query()->where('email', $data['email'])->first();
        $passwordOk = $user && Hash::check(
            $data['password'],
            $user->getRawOriginal('password') ?: $user->password
        );

        // Hanya super admin (role admin)
        if (! $passwordOk || ! $user->isSuperAdmin()) {
            return back()
                ->withInput($request->except('password'))
                ->withErrors([
                    'email' => 'Login admin tidak valid. Hanya akun role admin yang boleh update.',
                ]);
        }

        $optimize = $request->boolean('optimize', true);
        $result = Updater::run($optimize);

        // Catat siapa yang menjalankan (tanpa password)
        Updater::markUpdated(array_merge(
            Updater::lastUpdateMeta() ?? [],
            [
                'by' => $user->email,
                'ok' => $result['ok'],
                'pending_after' => $result['pending_after'],
                'updated_at' => now()->toIso8601String(),
            ]
        ));

        return redirect()
            ->route('update.show')
            ->with('update_result', $result)
            ->with('status', $result['message']);
    }
}
