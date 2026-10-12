#!/bin/bash

#PARAMETROS
HOST=${1:-'dominio'}
SERVICE_NUMBER=${2:-'1'}
MYSQL_PORT_HOST=${3:-'3307'}

#DOMINIO
if [ "$HOST" = "dominio" ]; then
    echo "Error: no ha ingresado dominio. Uso: bash install.sh midominio.com [numero_servicio] [puerto_mysql]"
    exit 1
fi

#VERSION
read -p "indique versión del facturador a instalar, [1] [2] [3] [4] [4-API] [5]: " version
if [ "$version" = '1' ]; then
    PROYECT='https://gitlab.com/rash07/facturadorpro1.git'
elif [ "$version" = '2' ]; then
    PROYECT='https://gitlab.com/facturaloperu/facturador/pro2.git'
elif [ "$version" = '3' ]; then
    PROYECT='https://gitlab.com/b.mendoza/facturadorpro3.git'
elif [ "$version" = '4' ]; then
    PROYECT='https://gitlab.com/carlomagno83/facturadorpro4.git'
elif [ "$version" = '4-API' ]; then
    PROYECT='https://gitlab.com/facturaloperu/facturador/pro4-apirest.git'
elif [ "$version" = '5' ]; then
    PROYECT='https://github.com/crsedano/FacturadorPro.git'
else
    echo "Error: versión no válida"
    exit 1
fi

#RUTA DE INSTALACION (RUTA ACTUAL DEL SCRIPT)
PATH_INSTALL=$(echo $PWD)
#NOMBRE DE CARPETA
DIR=$(echo $PROYECT | rev | cut -d'/' -f1 | rev | cut -d '.' -f1)$SERVICE_NUMBER
#DATOS DE ACCESO MYSQL
MYSQL_USER=$(echo $DIR)
MYSQL_PASSWORD=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 20 ; echo '')
MYSQL_DATABASE=$(echo $DIR)
MYSQL_ROOT_PASSWORD=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 20 ; echo '')


if [ $SERVICE_NUMBER = '1' ]; then
echo "Actualizando sistema"
apt-get -y update

echo "Instalando dependencias base"
apt-get -y install git-core curl gnupg lsb-release ca-certificates apt-transport-https software-properties-common

echo "Instalando Docker Engine"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get -y update
apt-get -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl start docker
systemctl enable docker

echo "Instalando certbot"
apt-get -y install certbot
mkdir -p $PATH_INSTALL/certs/

echo "Configurando red proxy"
docker network create proxynet

mkdir -p $PATH_INSTALL/proxy
cat << EOF > $PATH_INSTALL/proxy/docker-compose.yml
version: '3'

services:
    proxy:
        image: jwilder/nginx-proxy:alpine
        ports:
            - "80:80"
            - "443:443"
        volumes:
            - ./../certs:/etc/nginx/certs
            - /var/run/docker.sock:/tmp/docker.sock:ro
        restart: always
        privileged: true
networks:
    default:
        external:
            name: proxynet

EOF

cd $PATH_INSTALL/proxy
docker compose up -d

mkdir -p $PATH_INSTALL/proxy/fpms
fi

echo "Configurando $DIR"

if ! [ -d $PATH_INSTALL/proxy/fpms/$DIR ]; then
echo "Clonando repositorio"
rm -rf "$PATH_INSTALL/$DIR"
git clone "$PROYECT" "$PATH_INSTALL/$DIR"

mkdir -p $PATH_INSTALL/proxy/fpms/$DIR

cat << EOF > $PATH_INSTALL/proxy/fpms/$DIR/default
# Configuración de PHP para Nginx
server {
    listen 80 default_server;
    root /var/www/html/public;
    index index.html index.htm index.php;
    server_name *._;
    charset utf-8;
    server_tokens off;
    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }
    location = /robots.txt {
        log_not_found off;
        access_log off;
    }
    location / {
        try_files \$uri \$uri/ /index.php\$is_args\$args;
    }
    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass fpm$SERVICE_NUMBER:9000;
        fastcgi_read_timeout 3600;
    }
    error_page 404 /index.php;
    location ~ /\.ht {
        deny all;
    }
}
EOF

cat << EOF > $PATH_INSTALL/$DIR/docker-compose.yml
version: '3'

services:
    nginx$SERVICE_NUMBER:
        image: rash07/nginx
        working_dir: /var/www/html
        environment:
            VIRTUAL_HOST: $HOST, *.$HOST
        volumes:
            - ./:/var/www/html
            - $PATH_INSTALL/proxy/fpms/$DIR:/etc/nginx/sites-available
        depends_on:
            - fpm$SERVICE_NUMBER
        restart: always
    fpm$SERVICE_NUMBER:
        build:
            context: .
            dockerfile: Dockerfile
        working_dir: /var/www/html
        environment:
            - DB_HOST=mariadb$SERVICE_NUMBER
            - DB_PORT=3306
            - REDIS_HOST=redis$SERVICE_NUMBER
        volumes:
            - ./ssh:/root/.ssh
            - ./ssh:/var/www/.ssh
            - ./:/var/www/html
        depends_on:
            - mariadb$SERVICE_NUMBER
            - redis$SERVICE_NUMBER
        restart: always
    mariadb$SERVICE_NUMBER:
        image: mariadb:10.11
        environment:
            - MYSQL_USER=\${MYSQL_USER}
            - MYSQL_PASSWORD=\${MYSQL_PASSWORD}
            - MYSQL_DATABASE=\${MYSQL_DATABASE}
            - MYSQL_ROOT_PASSWORD=\${MYSQL_ROOT_PASSWORD}
        volumes:
            - mysqldata$SERVICE_NUMBER:/var/lib/mysql
        ports:
            - "\${MYSQL_PORT_HOST}:3306"
        restart: always
    redis$SERVICE_NUMBER:
        image: redis:7-alpine
        volumes:
            - redisdata$SERVICE_NUMBER:/data
        restart: always
    scheduling$SERVICE_NUMBER:
        build:
            context: .
            dockerfile: Dockerfile
        working_dir: /var/www/html
        command: bash -c "while true; do php artisan schedule:run --no-interaction; sleep 60; done"
        environment:
            - DB_HOST=mariadb$SERVICE_NUMBER
            - DB_PORT=3306
            - REDIS_HOST=redis$SERVICE_NUMBER
        volumes:
            - ./:/var/www/html
        depends_on:
            - mariadb$SERVICE_NUMBER
            - redis$SERVICE_NUMBER
        restart: always
    supervisor$SERVICE_NUMBER:
        build:
            context: .
            dockerfile: Dockerfile
        working_dir: /var/www/html
        command: supervisord -n -c /etc/supervisor/conf.d/supervisor.conf
        environment:
            - DB_HOST=mariadb$SERVICE_NUMBER
            - DB_PORT=3306
            - REDIS_HOST=redis$SERVICE_NUMBER
        volumes:
            - ./:/var/www/html
            - ./supervisor.conf:/etc/supervisor/conf.d/supervisor.conf
        depends_on:
            - mariadb$SERVICE_NUMBER
            - redis$SERVICE_NUMBER
        restart: always

networks:
    default:
        external:
            name: proxynet

volumes:
    redisdata$SERVICE_NUMBER:
        driver: "local"
    mysqldata$SERVICE_NUMBER:
        driver: "local"

EOF

cp $PATH_INSTALL/$DIR/.env.example $PATH_INSTALL/$DIR/.env

cat << EOF >> $PATH_INSTALL/$DIR/.env


MYSQL_USER=$MYSQL_USER
MYSQL_PASSWORD=$MYSQL_PASSWORD
MYSQL_DATABASE=$MYSQL_DATABASE
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_PORT_HOST=$MYSQL_PORT_HOST
EOF

echo "Configurando .env"
cd "$PATH_INSTALL/$DIR"

sed -i "/DB_DATABASE=/c\DB_DATABASE=$MYSQL_DATABASE" .env
sed -i "/DB_PASSWORD=/c\DB_PASSWORD=$MYSQL_ROOT_PASSWORD" .env
sed -i "/DB_HOST=/c\DB_HOST=mariadb$SERVICE_NUMBER" .env
sed -i "/DB_PORT=/c\DB_PORT=3306" .env
sed -i "/DB_USERNAME=/c\DB_USERNAME=root" .env
sed -i "/APP_URL_BASE=/c\APP_URL_BASE=$HOST" .env
sed -i '/APP_URL=/c\APP_URL=http://${APP_URL_BASE}' .env
sed -i '/FORCE_HTTPS=/c\FORCE_HTTPS=false' .env
sed -i '/APP_DEBUG=/c\APP_DEBUG=false' .env
sed -i '/QUEUE_CONNECTION=/c\QUEUE_CONNECTION=database' .env
sed -i '/REDIS_HOST=/c\REDIS_HOST=redis'"$SERVICE_NUMBER" .env

ADMIN_PASSWORD=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 10 ; echo '')
echo "Configurando seeder de usuario administrador"
mv "$PATH_INSTALL/$DIR/database/seeds/DatabaseSeeder.php" "$PATH_INSTALL/$DIR/database/seeds/DatabaseSeeder.php.bk"
cat << EOF > $PATH_INSTALL/$DIR/database/seeds/DatabaseSeeder.php
<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        \App\Models\System\User::create([
            'name'     => 'Administrador',
            'email'    => 'admin@$HOST',
            'password' => bcrypt('$ADMIN_PASSWORD'),
        ]);

        DB::table('plan_documents')->insert([
            ['id' => 1, 'description' => 'Facturas, boletas, notas de débito y crédito, resúmenes y anulaciones'],
            ['id' => 2, 'description' => 'Guias de remisión'],
            ['id' => 3, 'description' => 'Retenciones'],
            ['id' => 4, 'description' => 'Percepciones'],
        ]);

        \App\Models\System\Plan::create([
            'name'            => 'Ilimitado',
            'pricing'         => 99,
            'limit_users'     => 0,
            'limit_documents' => 0,
            'plan_documents'  => [1, 2, 3, 4],
            'locked'          => true,
        ]);
    }
}

EOF

echo "Construyendo imagen PHP 8.1 (puede tardar 3-5 min en la primera ejecución)..."
docker compose build

echo "Levantando contenedores"
docker compose up -d

echo "Instalando dependencias PHP"
docker compose exec -T fpm$SERVICE_NUMBER rm -f composer.lock
docker compose exec -T fpm$SERVICE_NUMBER composer install --no-dev --optimize-autoloader

echo "Ejecutando migraciones y seed"
docker compose exec -T fpm$SERVICE_NUMBER php artisan migrate:fresh --seed --force

echo "Configuración final de Laravel"
docker compose exec -T fpm$SERVICE_NUMBER php artisan key:generate --force
docker compose exec -T fpm$SERVICE_NUMBER php artisan storage:link
docker compose exec -T fpm$SERVICE_NUMBER php artisan config:cache
docker compose exec -T fpm$SERVICE_NUMBER php artisan route:cache
docker compose exec -T fpm$SERVICE_NUMBER git checkout .
docker compose exec -T fpm$SERVICE_NUMBER git config --global core.fileMode false

rm $PATH_INSTALL/$DIR/database/seeds/DatabaseSeeder.php
mv $PATH_INSTALL/$DIR/database/seeds/DatabaseSeeder.php.bk $PATH_INSTALL/$DIR/database/seeds/DatabaseSeeder.php

echo "Configurando permisos"
chmod -R 775 "$PATH_INSTALL/$DIR/storage/" "$PATH_INSTALL/$DIR/bootstrap/cache/"
chmod -R 755 "$PATH_INSTALL/$DIR/vendor/"
chmod +x $PATH_INSTALL/$DIR/script-update.sh

echo "Verificando workers de queue (supervisor)..."
sleep 3
docker compose exec -T supervisor$SERVICE_NUMBER supervisorctl status || true


#CONFIGURAR CLAVE SSH
if [ "$version" = '3' ] || [ "$version" = '4' ] || [ "$version" = '4-API' ] || [ "$version" = '5' ]; then
    read -p "¿Configurar clave SSH para actualizaciones automáticas? si[s] no[n]: " ssh_config
    if [ "$ssh_config" = "s" ]; then
        mkdir -p $PATH_INSTALL/$DIR/ssh
        ssh-keygen -t rsa -q -P "" -f $PATH_INSTALL/$DIR/ssh/id_rsa

        if [ "$version" = '5' ]; then
            REMOTE='git@github.com:crsedano/FacturadorPro.git'
            ssh-keyscan -H github.com >> $PATH_INSTALL/$DIR/ssh/known_hosts
            echo "----------------------------------------------"
            echo "Clave SSH para añadir en github.com/settings/keys"
        else
            REMOTE='git@gitlab.com:'$(echo $PROYECT | sed -e s#^https://gitlab.com/##)
            ssh-keyscan -H gitlab.com >> $PATH_INSTALL/$DIR/ssh/known_hosts
            echo "----------------------------------------------"
            echo "Clave SSH para añadir en gitlab.com/-/profile/keys"
        fi

        cd $PATH_INSTALL/$DIR
        git remote set-url origin $REMOTE
        docker compose exec -T fpm$SERVICE_NUMBER chown -R www-data ssh/ /var/www/
        cat $PATH_INSTALL/$DIR/ssh/id_rsa.pub
    fi
fi

#SSL
read -p "¿Instalar SSL gratuito con Let's Encrypt? si[s] no[n]: " ssl
if [ "$ssl" = "s" ]; then

    echo "--IMPORTANTE--"
    echo "--------------"
    echo "Copiar los TXT DNS sin usar [ctrl+c] ya que cancelará el proceso"
    echo "Ingresar correo electrónico y aceptar las preguntas"
    echo "--------------"

    certbot certonly --manual \
        -d "*.$HOST" -d "$HOST" \
        --agree-tos \
        --preferred-challenges dns-01 \
        --server https://acme-v02.api.letsencrypt.org/directory

    if ! [ -f /etc/letsencrypt/live/$HOST/privkey.pem ]; then
        echo "No se generó el certificado SSL"
    else
        cd "$PATH_INSTALL/$DIR"
        sed -i '/APP_URL=/c\APP_URL=https://${APP_URL_BASE}' .env
        sed -i '/FORCE_HTTPS=/c\FORCE_HTTPS=true' .env

        cp /etc/letsencrypt/live/$HOST/privkey.pem $PATH_INSTALL/certs/$HOST.key
        cp /etc/letsencrypt/live/$HOST/fullchain.pem $PATH_INSTALL/certs/$HOST.crt

        docker compose exec -T fpm$SERVICE_NUMBER php artisan config:cache
        docker compose exec -T fpm$SERVICE_NUMBER php artisan cache:clear

        cd $PATH_INSTALL/proxy && docker compose restart proxy
    fi

fi


echo ""
echo "======================================================"
echo "  Instalación completada"
echo "======================================================"
echo "  Ruta del proyecto : $PATH_INSTALL/$DIR"
echo "  URL               : $HOST"
echo "  Admin email       : admin@$HOST"
echo "  Admin password    : $ADMIN_PASSWORD"
echo "  MySQL root pass   : $MYSQL_ROOT_PASSWORD"
echo "  MySQL puerto host : $MYSQL_PORT_HOST"
echo "======================================================"

KEY_FILE=$PATH_INSTALL/$DIR/ssh/id_rsa.pub
KEY=""
if [ -f "$KEY_FILE" ]; then
    KEY=$(cat $KEY_FILE)
fi

cat << EOF > $PATH_INSTALL/$DIR.txt
Ruta del proyecto: $PATH_INSTALL/$DIR
======================================================
URL               : $HOST
Admin email       : admin@$HOST
Admin password    : $ADMIN_PASSWORD
======================================================
MySQL root pass   : $MYSQL_ROOT_PASSWORD
MySQL puerto host : $MYSQL_PORT_HOST
======================================================
Clave SSH pública:
$KEY

EOF

else
echo "La carpeta $PATH_INSTALL/proxy/fpms/$DIR ya existe. Abortando."
fi
