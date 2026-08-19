<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Tes merender root view Inertia yang memanggil @vite. Tanpa ini CI
        // wajib `npm run build` dulu cuma untuk bikin manifest.
        $this->withoutVite();
    }
}
