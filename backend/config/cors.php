<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Frontend (smage.my.id) mengakses API di api-cms.smage.my.id.
    | Karena menggunakan Bearer token (bukan cookie), tidak perlu
    | supports_credentials = true.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'https://smage.my.id'),
        'http://localhost:5173',    // dev
        'http://localhost:3000',    // dev alternatif
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
