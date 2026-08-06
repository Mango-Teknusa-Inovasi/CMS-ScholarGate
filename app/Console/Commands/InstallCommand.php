<?php

namespace App\Console\Commands;

use App\Support\Installer;
use Illuminate\Console\Command;

class InstallCommand extends Command
{
    protected $signature = 'scholargate:install
        {--driver= : Database driver: pgsql (default) atau mysql}
        {--host=127.0.0.1 : Database host}
        {--port= : Database port}
        {--database=scholargate : Nama database}
        {--username= : Database username}
        {--password= : Database password}
        {--url=http://localhost : APP_URL}
        {--admin-email=admin@scholargate.test : Email admin}
        {--admin-password=password : Password admin}
        {--admin-name=Admin Scholargate : Nama admin}
        {--no-seed : Jangan jalankan seeder demo}
        {--force : Paksa reinstall (hapus lock)}';

    protected $description = 'Instalasi pertama CMS Scholargate (pilih PostgreSQL / MySQL-MariaDB)';

    public function handle(): int
    {
        $this->components->info('Scholargate CMS — Installer');

        if ((Installer::isInstalled() || Installer::looksInstalled()) && ! $this->option('force')) {
            $this->components->warn('Sudah terpasang (lock file atau data DB terdeteksi).');
            $this->line('  Gunakan --force untuk mengulang (hati-hati: migrate:fresh menghapus data).');

            return self::FAILURE;
        }

        if ($this->option('force')) {
            if (Installer::looksInstalled() || Installer::isInstalled()) {
                if (! $this->confirm('PERINGATAN: re-install akan migrate:fresh (hapus semua tabel). Lanjutkan?', false)) {
                    $this->components->warn('Dibatalkan.');

                    return self::FAILURE;
                }
            }
            Installer::removeLockFile();
        }

        $req = Installer::checkRequirements();
        if (! $req['ok']) {
            $this->components->error('Persyaratan belum terpenuhi:');
            foreach ($req['missing'] as $item) {
                $this->line('  - '.$item);
            }

            return self::FAILURE;
        }

        $drivers = Installer::drivers();
        $driver = $this->option('driver');

        if (! $driver) {
            $choices = [];
            foreach ($drivers as $key => $meta) {
                $choices[$key] = $meta['label'];
            }
            $driver = $this->choice('Pilih database', array_values($choices), 0);
            // map label back to key
            $driver = array_search($driver, $choices, true) ?: 'pgsql';
        }

        if (! isset($drivers[$driver])) {
            $this->components->error('Driver tidak valid. Gunakan: pgsql | mysql | mariadb');

            return self::FAILURE;
        }

        $defaultPort = (string) $drivers[$driver]['default_port'];
        $defaultUser = $drivers[$driver]['default_user'] ?? ($driver === 'pgsql' ? 'postgres' : 'root');

        $host = $this->option('host') ?: $this->ask('Database host', '127.0.0.1');
        $port = $this->option('port') ?: $this->ask('Database port', $defaultPort);
        $database = $this->option('database') ?: $this->ask('Nama database', 'scholargate');
        $username = $this->option('username') ?: $this->ask('Database username', $defaultUser);
        $password = $this->option('password');
        if ($password === null) {
            $password = $this->secret('Database password (kosongkan jika tidak ada)') ?? '';
        }

        $url = $this->option('url') ?: $this->ask('APP_URL (URL publik situs)', 'http://localhost');
        $adminEmail = $this->option('admin-email') ?: $this->ask('Email admin', 'admin@scholargate.test');
        $adminPassword = $this->option('admin-password') ?: $this->secret('Password admin') ?: 'password';
        $adminName = $this->option('admin-name') ?: $this->ask('Nama admin', 'Admin Scholargate');
        $seed = ! $this->option('no-seed');

        $this->newLine();
        $this->table(['Key', 'Value'], [
            ['Driver', $driver === 'pgsql' ? 'PostgreSQL' : 'MySQL / MariaDB'],
            ['Host', "{$host}:{$port}"],
            ['Database', $database],
            ['Username', $username],
            ['APP_URL', $url],
            ['Admin', $adminEmail],
            ['Seed demo', $seed ? 'ya' : 'tidak'],
        ]);

        if (! $this->confirm('Lanjutkan instalasi?', true)) {
            $this->components->warn('Dibatalkan.');

            return self::FAILURE;
        }

        $this->components->task('Menulis konfigurasi & menjalankan migrasi', function () use (
            $driver, $host, $port, $database, $username, $password, $url,
            $adminEmail, $adminPassword, $adminName, $seed
        ) {
            $result = Installer::run([
                'db_connection' => $driver,
                'db_host' => $host,
                'db_port' => $port,
                'db_database' => $database,
                'db_username' => $username,
                'db_password' => $password,
                'app_url' => $url,
                'app_name' => 'Scholargate',
                'admin_email' => $adminEmail,
                'admin_password' => $adminPassword,
                'admin_name' => $adminName,
                'seed' => $seed,
            ]);

            if (! $result['ok']) {
                throw new \RuntimeException($result['message'].(
                    ! empty($result['errors']) ? ' — '.implode('; ', $result['errors']) : ''
                ));
            }
        });

        $this->newLine();
        $this->components->info('Instalasi selesai.');
        $this->line('  Admin login : '.$adminEmail);
        $this->line('  Panel admin : '.rtrim($url, '/').'/admin/login');
        $this->line('  Installer web dikunci (ALLOW_INSTALL=false + storage/app/installed)');
        $this->line('  Pastikan SPA sudah di-build: npm run build (di folder frontend)');

        if (! Installer::spaExists()) {
            $this->components->warn('SPA belum ter-build di public/spa. Untuk production/shared hosting jalankan: npm run build');
        }

        return self::SUCCESS;
    }
}
