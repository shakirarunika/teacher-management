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
