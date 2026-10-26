<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Foundation\Vite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

$root = dirname(__DIR__, 2);
if (getenv('APP_ENV') !== 'testing') {
    http_response_code(403);
    exit;
}
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path !== '/' && is_file($root.'/public'.$path)) {
    return false;
}
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
config(['cache.stores.file.path' => $root.'/.cache/ppid-review/cache', 'cache.stores.file.lock_path' => $root.'/.cache/ppid-review/locks']);
Cache::purge('file');
$app->make(Vite::class)->useHotFile($root.'/.cache/ppid-review/unused-hot');
$app->handleRequest(Request::capture());
