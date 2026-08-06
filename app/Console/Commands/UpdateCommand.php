<?php

namespace App\Console\Commands;

use App\Support\Installer;
use App\Support\Updater;
use Illuminate\Console\Command;

class UpdateCommand extends Command
{
    protected $signature = 'scholargate:update
        {--no-optimize : Jangan jalankan config/route cache}';

    protected $description = 'Update mudah: migrate + clear/cache (setara /update di web)';

    public function handle(): int
    {
        if (! Installer::isInstalled()) {
            $this->components->error('Belum terpasang. Jalankan scholargate:install dulu.');

            return self::FAILURE;
        }

        $status = Updater::status();
        $this->components->info('Scholargate update');
        $this->line('  Migrasi pending: '.$status['pending_count']);

        if ($status['pending_count'] > 0) {
            foreach (array_slice($status['pending'], 0, 15) as $m) {
                $this->line('   - '.$m);
            }
        }

        if (! $this->confirm('Lanjutkan update?', true)) {
            return self::FAILURE;
        }

        $result = Updater::run(! $this->option('no-optimize'));

        foreach ($result['steps'] as $step) {
            if ($step['ok']) {
                $this->components->twoColumnDetail($step['name'], 'OK');
            } else {
                $this->components->error($step['name'].': '.$step['output']);
            }
        }

        if ($result['ok']) {
            $this->components->info($result['message']);

            return self::SUCCESS;
        }

        $this->components->error($result['message']);

        return self::FAILURE;
    }
}
