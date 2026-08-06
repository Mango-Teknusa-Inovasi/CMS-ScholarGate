<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'group'];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $all = static::allAsArray();

        return $all[$key] ?? $default;
    }

    public static function allAsArray(): array
    {
        return Cache::remember('settings.all', 60, function () {
            return static::query()->pluck('value', 'key')->toArray();
        });
    }

    public static function setValue(string $key, mixed $value, string $group = 'general'): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'group' => $group]
        );
        Cache::forget('settings.all');
    }
}
