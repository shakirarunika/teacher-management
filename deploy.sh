#!/usr/bin/env bash
# Deploy script untuk PC server (jalankan: bash deploy.sh)
# Pull perubahan terbaru dari GitHub lalu siapkan aplikasi.
set -e

echo ">> Pull dari GitHub..."
git pull

echo ">> Install dependency PHP..."
composer install --no-dev --optimize-autoloader

echo ">> Jalankan migration..."
php artisan migrate --force

echo ">> Build asset frontend..."
npm ci
npm run build

echo ">> Refresh cache Laravel + Filament..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan filament:cache-components

echo ">> Deploy selesai."
