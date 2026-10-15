#!/bin/bash

SERVICE_NUMBER=${1:-'1'}

echo "Actualizando código..."
git pull origin master

echo "Instalando dependencias PHP..."
docker compose exec -T fpm$SERVICE_NUMBER composer install --no-dev --optimize-autoloader

echo "Ejecutando migraciones..."
docker compose exec -T fpm$SERVICE_NUMBER php artisan migrate --force
docker compose exec -T fpm$SERVICE_NUMBER php artisan tenancy:run tenant:migrate --force

echo "Limpiando caché..."
docker compose exec -T fpm$SERVICE_NUMBER php artisan cache:clear
docker compose exec -T fpm$SERVICE_NUMBER php artisan config:cache
docker compose exec -T fpm$SERVICE_NUMBER php artisan route:cache
docker compose exec -T fpm$SERVICE_NUMBER php artisan view:clear

echo "Actualizando permisos..."
chmod -R 775 storage/ bootstrap/cache/

echo "Actualización completada."
