<?php
declare(strict_types=1);

return [
    'settings' => [
        'displayErrorDetails' => ($_ENV['APP_DEBUG'] ?? 'true') === 'true',
        'logErrors' => true,
        'logErrorDetails' => true,
        'app' => [
            'name' => 'OdontoDesa API',
            'version' => '2.0.0',
            'env' => $_ENV['APP_ENV'] ?? 'development',
        ],
        'jwt' => [
            'secret' => $_ENV['JWT_SECRET'] ?? 'default_odontodesa_secret_key_2026',
            'expiration' => (int)($_ENV['JWT_EXPIRATION_HOURS'] ?? 24) * 3600,
        ],
    ],
];
