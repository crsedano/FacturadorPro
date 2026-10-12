<?php

namespace App\Traits;

trait UsesSystemConnection
{
    public function getConnectionName()
    {
        return 'system';
    }
}
