<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;

class BackupDatabase extends Command
{
    protected $signature = 'backup:database {--keep=7 : Jumlah file backup terakhir yang disimpan}';

    protected $description = 'Dump database ke storage/app/backups lalu hapus backup lama';

    public function handle(): int
    {
        $db = config('database.connections.' . config('database.default'));

        if (($db['driver'] ?? null) !== 'mysql') {
            $this->error('Backup hanya mendukung MySQL, koneksi aktif: ' . ($db['driver'] ?? 'tidak dikenal'));

            return self::FAILURE;
        }

        $dir = storage_path('app/backups');
        is_dir($dir) || mkdir($dir, 0755, true);
        $file = $dir . '/backup-' . now()->format('Y-m-d-His') . '.sql';

        // Password lewat env MYSQL_PWD, bukan argumen CLI — argumen kelihatan
        // di daftar proses dan bisa terbaca user lain di mesin yang sama.
        $result = Process::timeout(1800)
            ->env(['MYSQL_PWD' => (string) $db['password']])
            ->run([
                config('database.mysqldump_path'),
                '--host=' . $db['host'],
                '--port=' . $db['port'],
                '--user=' . $db['username'],
                '--single-transaction',
                '--routines',
                '--result-file=' . $file,
                $db['database'],
            ]);

        if (! $result->successful()) {
            @unlink($file);
            $this->error('mysqldump gagal: ' . trim($result->errorOutput() ?: $result->output()));

            return self::FAILURE;
        }

        $this->prune((int) $this->option('keep'), $dir);

        $this->info('Backup selesai: ' . $file . ' (' . round(filesize($file) / 1024) . ' KB)');

        return self::SUCCESS;
    }

    /** Sisakan N backup terbaru, hapus sisanya. */
    private function prune(int $keep, string $dir): void
    {
        $files = glob($dir . '/backup-*.sql');
        rsort($files); // nama file berformat waktu, urut nama = urut waktu

        foreach (array_slice($files, max($keep, 1)) as $old) {
            @unlink($old);
        }
    }
}
