<?php

namespace App\Services\Ppid;

use App\Models\Ppid\Configuration;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Schema;

class Settings
{
    public static function get(): array
    {
        $data = Schema::hasTable('ppid_settings') ? Configuration::find(1)?->data : [];

        return array_replace([
            'enabled' => true, 'accepting' => false, 'name' => 'PPID', 'email' => '', 'phone' => '',
            'address' => '', 'hours' => '', 'profile' => '', 'standards' => '', 'complaint_url' => '',
            'holidays' => [], 'weekend' => [0, 6], 'survey_weights' => [],
        ], $data ?? []);
    }

    public static function ready(): bool
    {
        $s = self::get();

        return (bool) ($s['email'] && $s['phone'] && User::whereNotNull('ppid_roles')->get()->contains(fn ($u) => count($u->ppid_roles ?? []) > 0) && app(FileStore::class)->ready());
    }

    public static function enabled(): void
    {
        abort_unless(self::get()['enabled'], 404);
    }

    public static function publicData(): array
    {
        return array_intersect_key(self::get(), array_flip(['enabled', 'accepting', 'name', 'email', 'phone', 'address', 'hours', 'profile', 'standards', 'complaint_url']));
    }

    public static function due(CarbonInterface $date, int $days): CarbonInterface
    {
        $s = self::get();
        $date = $date->copy();
        while ($days > 0) {
            $date->addDay();
            if (! in_array($date->dayOfWeek, $s['weekend']) && ! in_array($date->toDateString(), $s['holidays'])) {
                $days--;
            }
        }

        return $date;
    }
}
