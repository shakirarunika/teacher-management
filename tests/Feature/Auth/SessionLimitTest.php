<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SessionLimitTest extends TestCase
{
    use RefreshDatabase;

    private function fakeSession(User $user, string $id, int $lastActivity): void
    {
        DB::table('sessions')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'test',
            'payload' => base64_encode(serialize([])),
            'last_activity' => $lastActivity,
        ]);
    }

    public function test_login_prunes_sessions_beyond_two_and_rotates_remember_token(): void
    {
        $user = User::factory()->create(['remember_token' => 'token-lama']);

        // 3 sesi lama — setelah login hanya 1 terbaru yang boleh tersisa
        // (plus sesi login ini = maks 2 total).
        $this->fakeSession($user, 'sesi-a', 100);
        $this->fakeSession($user, 'sesi-b', 200);
        $this->fakeSession($user, 'sesi-c', 300);

        $this->post('/login', ['email' => $user->email, 'password' => 'password']);

        $this->assertAuthenticated();
        $remaining = DB::table('sessions')->where('user_id', $user->id)->pluck('id');
        $this->assertSame(['sesi-c'], $remaining->all());

        // Cookie "ingat saya" perangkat lama harus mati
        $this->assertNotSame('token-lama', $user->fresh()->remember_token);
    }
}
