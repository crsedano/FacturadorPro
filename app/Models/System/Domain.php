<?php

namespace App\Models\System;

use Stancl\Tenancy\Database\Models\Domain as BaseDomain;

class Domain extends BaseDomain
{
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
