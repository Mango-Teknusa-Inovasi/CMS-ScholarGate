# ── Laravel PHP-FPM + Nginx (Alpine) ─────────────────────────
FROM php:8.3-fpm-alpine

# Install system deps (nama package Alpine berbeda dari Debian!)
RUN apk add --no-cache \
    nginx \
    supervisor \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    # Supervisor butuh python3 di beberapa Alpine versi
    && mkdir -p /etc/supervisor/conf.d \
    && mkdir -p /var/log/supervisor \
    # Install PHP extensions
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        bcmath \
        zip \
        opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install deps dulu (layer cache)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy semua source
COPY . .

# Finalize
RUN composer install --no-dev --optimize-autoloader --prefer-dist \
    && php artisan storage:link || true \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Config Nginx dan Supervisor
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
