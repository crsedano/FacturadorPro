<?php

namespace App\Models\System;

use Illuminate\Support\Facades\DB;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase;

    public $incrementing = false;
    protected $keyType = 'string';

    public function getIncrementing()
    {
        return false;
    }

    public function getKeyType()
    {
        return 'string';
    }

    public static function findByWebsiteId(int $websiteId): ?self
    {
        $uuid = DB::connection('system')
            ->table('websites')
            ->where('id', $websiteId)
            ->value('uuid');
        return $uuid ? self::find($uuid) : null;
    }

    public function domains()
    {
        return $this->hasMany(Domain::class);
    }
}
