<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Sanity check that the PHPUnit runner is wired.
 */
class ExampleTest extends TestCase
{
    public function test_true_is_true(): void
    {
        $this->assertTrue(true);
    }
}
