<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS)
    |--------------------------------------------------------------------------
    |
    | Primary deployment is a same-origin monolith (Inertia + API on one host).
    | CORS is still configured for optional split-origin tooling and local Vite.
    | Prefer same-origin production — do not use wildcard origins with credentials.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_values(array_filter([
        env('APP_URL'),
        env('FRONTEND_URL'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:8010',
        'http://127.0.0.1:8010',
    ])),

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'X-Requested-With',
        'X-XSRF-TOKEN',
        'X-Inertia',
        'X-Inertia-Version',
        'X-CSRF-TOKEN',
    ],

    'exposed_headers' => [
        'X-Inertia',
        'X-Inertia-Location',
    ],

    'max_age' => 60 * 60,

    // Required when the browser sends cookies (Sanctum stateful / session)
    'supports_credentials' => true,

];
