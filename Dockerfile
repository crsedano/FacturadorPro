FROM php:8.1-fpm

# System dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    zip \
    cron \
    supervisor \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libwebp-dev \
    libgmp-dev \
    libicu-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    libsodium-dev \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Configure GD with freetype + jpeg + webp (mPDF, intervention/image)
RUN docker-php-ext-configure gd \
    --with-freetype \
    --with-jpeg \
    --with-webp

# Core PHP extensions
RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    xml \
    dom \
    intl \
    soap \
    opcache \
    sockets

# Redis (PECL)
RUN pecl install redis \
    && docker-php-ext-enable redis

# Composer 2
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# PHP config
RUN echo "upload_max_filesize = 64M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "post_max_size = 64M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "memory_limit = 512M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/custom.ini

WORKDIR /var/www/html
