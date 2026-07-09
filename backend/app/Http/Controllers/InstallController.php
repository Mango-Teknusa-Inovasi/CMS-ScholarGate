<?php

namespace App\Http\Controllers;

use App\Support\Installer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class InstallController extends Controller
{
    public function show(): View|RedirectResponse
    {
        if (Installer::isInstalled()) {
            return redirect('/');
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
        ]);
    }

    public function store(Request $request): RedirectResponse|View
    {
        if (Installer::isInstalled()) {
            return redirect('/');
        }

        $data = $request->validate([
            'db_connection' => ['required', 'in:pgsql,mysql'],
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
        ]);

        // checkbox + hidden: "1" = seed demo, "0" = skip
        $data['seed'] = (string) $request->input('seed', '1') === '1';
        $data['app_name'] = 'Scholargate';

        $result = Installer::run($data);

        if (! $result['ok']) {
            return back()
                ->withInput()
                ->withErrors(['install' => $result['message']])
                ->with('install_errors', $result['errors'] ?? []);
        }

        return redirect('/admin/login')
            ->with('status', 'Instalasi berhasil. Silakan login.');
    }
}
