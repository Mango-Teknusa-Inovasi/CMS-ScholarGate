<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CreateAdminCommand extends Command
{
    protected $signature = 'scholargate:admin
        {email=admin@sman1gedeg.sch.id : Email admin}
        {password=PasswordAdmin123 : Password admin}
        {name=Admin SMAN 1 Gedeg : Nama admin}';

    protected $description = 'Buat atau reset password akun admin CMS';

    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $password = (string) $this->argument('password');
        $name = (string) $this->argument('name');

        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password,
                'role' => 'admin',
            ]
        );

        $this->components->info('Akun Admin CMS berhasil dibuat / di-reset:');
        $this->line('  Email    : '.$user->email);
        $this->line('  Password : '.$password);
        $this->line('  Role     : '.$user->role);
        $this->line('  ID       : '.$user->id);

        return self::SUCCESS;
    }
}
