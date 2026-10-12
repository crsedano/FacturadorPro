<?php

declare(strict_types=1);

use App\Models\System\Domain;
use App\Models\System\Tenant;
use Stancl\Tenancy\Bootstrappers\DatabaseTenancyBootstrapper;

return [
    'tenant_model' => Tenant::class,

    'id_generator' => null, // IDs are set manually (UUID from subdomain config)

    'domain_model' => Domain::class,

    /**
     * Central domains — requests from these hosts are NOT treated as tenant requests.
     * The system admin panel lives here.
     */
    'central_domains' => [
        env('APP_URL_BASE', 'localhost'),
        '127.0.0.1',
        'localhost',
    ],

    /**
     * Only DatabaseTenancyBootstrapper is needed; cache/filesystem can be
     * added later once the app is verified working on stancl.
     */
    'bootstrappers' => [
        DatabaseTenancyBootstrapper::class,
    ],

    'database' => [
        'central_connection' => 'system',

        /**
         * Use system connection as template — tenant connection inherits host/port/user
         * from system and overrides only the database name (and optionally username/password
         * stored in tenants.data).
         */
        'template_tenant_connection' => null,

        'prefix' => '',
        'suffix' => '',

        'managers' => [
            'mysql' => \Stancl\Tenancy\TenantDatabaseManagers\MySQLDatabaseManager::class,
            'mariadb' => \Stancl\Tenancy\TenantDatabaseManagers\MySQLDatabaseManager::class,
        ],
    ],

    'cache' => [
        'tag_base' => 'tenant',
    ],

    'filesystem' => [
        'suffix_base' => 'tenant',
        'disks' => ['local', 'public'],
        'root_override' => [
            'local' => '%storage_path%/app/',
            'public' => '%storage_path%/app/public/',
        ],
        'suffix_storage_path' => true,
        'asset_helper_tenancy' => false,
    ],

    'redis' => [
        'prefix_base' => 'tenant',
        'prefixed_connections' => [],
    ],

    'features' => [],

    'routes' => false,

    'migration_parameters' => [
        '--force' => true,
        '--path' => [database_path('migrations/tenant')],
        '--realpath' => true,
    ],

    'seeder_parameters' => [
        '--class' => 'TenancyDatabaseSeeder',
    ],
];
