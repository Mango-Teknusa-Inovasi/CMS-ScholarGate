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

    /** @var array<string, list<array{content: string|array, priority: int}>> */
    private array $widgets = [];

    /**
     * Add a UI Widget/HTML snippet to a named theme HookSlot.
     */
    public function addWidget(string $slot, string|array $content, int $priority = 10): void
    {
        $this->widgets[$slot][] = ['content' => $content, 'priority' => $priority];
    }

    /**
     * Get all registered UI widgets grouped by slot name for frontend HookSlot rendering.
     *
     * @return array<string, list<string|array>>
     */
    public function getRegisteredHooks(): array
    {
        $result = [];
        foreach ($this->widgets as $slot => $items) {
            usort($items, fn ($a, $b) => $a['priority'] <=> $b['priority']);
            $result[$slot] = array_column($items, 'content');
        }

        return $result;
    }
}
