<?php

namespace App\Services\Plugin;

class HookManager
{
    /** @var array<string, list<array{callback: callable, priority: int}>> */
    private array $actions = [];

    /** @var array<string, list<array{callback: callable, priority: int}>> */
    private array $filters = [];

    /**
     * Add an Action Hook (Event Listener).
     */
    public function addAction(string $hook, callable $callback, int $priority = 10): void
    {
        $this->actions[$hook][] = ['callback' => $callback, 'priority' => $priority];
    }

    /**
     * Trigger an Action Hook.
     */
    public function doAction(string $hook, mixed ...$args): void
    {
        if (empty($this->actions[$hook])) {
            return;
        }

        $callbacks = $this->actions[$hook];
        usort($callbacks, fn ($a, $b) => $a['priority'] <=> $b['priority']);

        foreach ($callbacks as $item) {
            call_user_func_array($item['callback'], $args);
        }
    }

    /**
     * Add a Filter Hook (Data Transformer).
     */
    public function addFilter(string $hook, callable $callback, int $priority = 10): void
    {
        $this->filters[$hook][] = ['callback' => $callback, 'priority' => $priority];
    }

    /**
     * Apply a Filter Hook to transform data.
     */
    public function applyFilter(string $hook, mixed $value, mixed ...$extra): mixed
    {
        if (empty($this->filters[$hook])) {
            return $value;
        }

        $callbacks = $this->filters[$hook];
        usort($callbacks, fn ($a, $b) => $a['priority'] <=> $b['priority']);

        foreach ($callbacks as $item) {
            $value = call_user_func_array($item['callback'], array_merge([$value], $extra));
        }

        return $value;
    }
}
