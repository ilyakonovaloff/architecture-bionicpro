FROM php:8.2-fpm

# Установка nginx и расширений PHP
RUN apt-get update && apt-get install -y \
    nginx \
    libzip-dev \
    zip \
    && docker-php-ext-install zip

# Копирование файлов приложения
COPY . /var/www/html/

# Копирование конфигурации nginx
COPY nginx.conf /etc/nginx/sites-available/default

# Установка прав доступа
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Удаление дефолтной конфигурации и создание символической ссылки
RUN rm -f /etc/nginx/sites-enabled/default \
    && ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

EXPOSE 80

# Запуск nginx и php-fpm
CMD service nginx start && php-fpm 