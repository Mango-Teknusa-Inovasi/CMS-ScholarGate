<?php

use App\Models\Ppid\Configuration;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! app()->environment('testing') || config('database.default') !== 'sqlite' || realpath(config('database.connections.sqlite.database')) !== realpath(__DIR__.'/../../.cache/ppid-review/database.sqlite')) {
    throw new RuntimeException('Only the isolated PPID testing database is allowed.');
}

User::updateOrCreate(['email' => 'ppid-test@example.test'], ['name' => 'Petugas Uji PPID', 'password' => 'PpidTestOnly2026!', 'role' => 'admin', 'ppid_roles' => ['manager', 'service', 'publisher']]);
User::updateOrCreate(['email' => 'staff-test@example.test'], ['name' => 'Petugas layanan', 'password' => 'PpidTestOnly2026!', 'role' => 'member', 'ppid_roles' => ['service']]);
Setting::setValue('site_name', 'Sekolah Uji PPID');
Configuration::updateOrCreate(['id' => 1], ['data' => ['enabled' => true, 'accepting' => true, 'name' => 'PPID Sekolah Uji', 'email' => 'layanan@example.test', 'phone' => '0341 000000', 'hours' => 'Senin–Jumat, 08.00–15.00 WIB', 'profile' => 'Profil PPID untuk pengujian.', 'standards' => 'Pelayanan informasi publik melalui formulir atau meja layanan.']]);
