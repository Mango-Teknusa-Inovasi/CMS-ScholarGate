# Backend (Laravel API + SPA host)

Production app. Document root = **`public/`**.

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed          # dev
php artisan scholargate:install     # first install
php artisan serve
```

SPA build dari folder `../frontend` masuk ke `public/spa/`.

Deploy: [../docs/DEPLOY.md](../docs/DEPLOY.md) · Go-live: [../docs/GO-LIVE.md](../docs/GO-LIVE.md)
