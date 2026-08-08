<?php

namespace App\Support;

use App\Services\Plugin\HookManager;
use Illuminate\Support\Facades\Facade;

/**
 * @method static void addAction(string $hook, callable $callback, int $priority = 10)
 * @method static void doAction(string $hook, mixed ...$args)
 * @method static void addFilter(string $hook, callable $callback, int $priority = 10)
 * @method static mixed applyFilter(string $hook, mixed $value, mixed ...$extra)
 *
 * @see \App\Services\Plugin\HookManager
 */
class Hook extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return HookManager::class;
    }
}
