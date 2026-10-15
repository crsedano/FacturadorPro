<?php

namespace App\Tenancy;

use Illuminate\Config\Repository;
use Illuminate\Filesystem\FilesystemManager;
use Stancl\Tenancy\Contracts\TenancyBootstrapper;
use Stancl\Tenancy\Contracts\Tenant;

class TenantStorageBootstrapper implements TenancyBootstrapper
{
    public function __construct(
        protected Repository $config,
        protected FilesystemManager $storage,
    ) {}

    public function bootstrap(Tenant $tenant): void
    {
        $this->config->set('filesystems.disks.tenant', [
            'driver' => 'local',
            'root'   => storage_path('app/tenancy/tenants/' . $tenant->id),
        ]);
        $this->storage->forgetDisk('tenant');
    }

    public function revert(): void
    {
        $this->config->set('filesystems.disks.tenant', null);
        $this->storage->forgetDisk('tenant');
    }
}
