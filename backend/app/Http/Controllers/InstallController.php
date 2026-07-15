<?php

namespace App\Http\Controllers;

use App\Support\Installer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\View\View;

class InstallController extends Controller
{
    public function show(): View|RedirectResponse|Response
    {
        if (Installer::isInstalled()) {
            return redirect('/');
        }

        if (! Installer::canInstallViaWeb()) {
            return $this->lockedResponse();
        }

        $requirements = Installer::checkRequirements();
        $drivers = Installer::drivers();

        foreach ($drivers as $key => $meta) {
            $drivers[$key]['available'] = extension_loaded($meta['extension']);
        }

        return view('install', [
            'requirements' => $requirements,
            'drivers' => $drivers,
            'defaults' => [
                'db_connection' => 'pgsql',
                'db_host' => '127.0.0.1',
                'db_port' => 5432,
                'db_database' => 'scholargate',
                'db_username' => 'postgres',
                'app_url' => url('/'),
                'admin_email' => 'admin@scholargate.test',
                'admin_name' => 'Admin Scholargate',
            ],
            'forceWarning' => Installer::looksInstalled() && Installer::allowInstallFlag(),
        ]);
    }

    public function store(Request $request): RedirectResponse|View|Response
    {
        if (Installer::isInstalled()) {
            return redirect('/');
        }

        if (! Installer::canInstallViaWeb()) {
            return $this->lockedResponse();
        }

        $data = $request->validate([
            'db_connection' => ['required', 'in:pgsql,mysql,mariadb'],
            'db_host' => ['required', 'string', 'max:255'],
            'db_port' => ['required', 'integer', 'min:1', 'max:65535'],
            'db_database' => ['required', 'string', 'max:255'],
            'db_username' => ['required', 'string', 'max:255'],
            'db_password' => ['nullable', 'string', 'max:255'],
            'app_url' => ['required', 'url', 'max:255'],
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255'],
            'admin_password' => ['required', 'string', 'min:8', 'max:255'],
            'seed' => ['nullable', 'boolean'],
            // Konfirmasi eksplisit jika re-install (DB sudah berisi)
            'confirm_reinstall' => ['nullable', 'accepted'],
        ]);

        if (Installer::looksInstalled() && ! $request->boolean('confirm_reinstall')) {
            return back()
                ->withInput()
                ->withErrors([
                    'install' => 'Database sudah berisi data. Centang konfirmasi re-install (migrate:fresh akan menghapus data) atau batalkan.',
                ]);
        }

        // checkbox + hidden: "1" = seed demo, "0" = skip
        $data['seed'] = (string) $request->input('seed', '1') === '1';
        $data['app_name'] = 'Scholargate';

        $result = Installer::run($data, viaWeb: true);

        if (! $result['ok']) {
            return back()
                ->withInput()
                ->withErrors(['install' => $result['message']])
                ->with('install_errors', $result['errors'] ?? []);
        }

        return redirect('/admin/login')
            ->with('status', 'Instalasi berhasil. Installer web telah dikunci (ALLOW_INSTALL=false). Silakan login.');
    }

    private function lockedResponse(): Response
    {
        return response()
            ->view('install-locked', [
                'reason' => Installer::installBlockedReason(),
            ], 403);
    }
}
