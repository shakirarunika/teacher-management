#!/usr/bin/env bash
# Deploy script untuk PC server (jalankan: bash deploy.sh)
# Pull perubahan terbaru dari GitHub lalu siapkan aplikasi.
set -e

echo ">> Pull dari GitHub..."
# Lockfile itu file generate — perubahan lokal di server (mis. npm install
# manual) dibuang supaya tidak memblokir pull.
git checkout -- package-lock.json composer.lock 2>/dev/null || true
git pull

echo ">> Install dependency PHP..."
composer install --no-dev --optimize-autoloader

echo ">> Backup database sebelum migration..."
# set -e sengaja dibiarkan: kalau backup gagal, deploy berhenti.
# Jangan pernah migrate tanpa titik balik.
php artisan backup:database

echo ">> Jalankan migration..."
php artisan migrate --force

echo ">> Symlink storage (upload media soal)..."
php artisan storage:link --force

echo ">> Build asset frontend..."
npm ci
npm run build

echo ">> Refresh cache Laravel + Filament..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan filament:cache-components

echo ">> Deploy selesai."

# ---------------------------------------------------------------------------
# Scheduler (backup harian + pengingat langganan) TIDAK jalan sendiri.
# Daftarkan sekali saja di Windows Task Scheduler, jalan tiap menit:
#
#   schtasks /create /tn "Sintesis Scheduler" /sc minute /mo 1 /ru SYSTEM ^
#     /tr "cmd /c cd /d C:\laragon\www\teacher-management && php artisan schedule:run"
#
# Cek terdaftar:  schtasks /query /tn "Sintesis Scheduler"
# Cek jadwalnya:  php artisan schedule:list
#
# Queue worker tidak diperlukan: QUEUE_CONNECTION=sync dan belum ada job
# ShouldQueue. Kalau nanti ada, ganti ke database + jalankan queue:work.
# ---------------------------------------------------------------------------
