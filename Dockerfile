# Dockerfile for PHP Backend
FROM php:8.2-apache

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Enable Apache modules (env: PassEnv DB_* tới PHP)
RUN a2enmod rewrite headers env

# Copy custom Apache VirtualHost config
COPY docker/000-default.conf /etc/apache2/sites-available/000-default.conf

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    && docker-php-ext-install zip

# Configure PHP
RUN echo "session.cookie_httponly = 1" >> /usr/local/etc/php/conf.d/session.ini \
    && echo "session.cookie_samesite = Lax" >> /usr/local/etc/php/conf.d/session.ini \
    && echo "session.gc_maxlifetime = 3600" >> /usr/local/etc/php/conf.d/session.ini \
    && echo "upload_max_filesize = 10M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 10M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "display_errors = Off" >> /usr/local/etc/php/conf.d/errors.ini \
    && echo "log_errors = On" >> /usr/local/etc/php/conf.d/errors.ini \
    && echo "error_log = /var/log/php_errors.log" >> /usr/local/etc/php/conf.d/errors.ini

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Create uploads directory
RUN mkdir -p /var/www/html/backend/uploads/avatars \
    && chown -R www-data:www-data /var/www/html/backend/uploads \
    && chmod -R 777 /var/www/html/backend/uploads

# Copy entrypoint script (fix MPM at runtime, not just build time)
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port 80
EXPOSE 80

# Start via entrypoint (fixes MPM before Apache starts)
CMD ["/entrypoint.sh"]
