<?php

namespace App\Providers;

use Illuminate\Cache\RedisStore;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class CacheServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Cache::extend('redis_tenancy', function ($app) {
            if (PHP_SAPI === 'cli') {
                $uuid = $app['config']['driver'];
            } else {
                // ok, this is basically a hack to set the redis cache store
                // prefix to the UUID of the current website being called
                $fqdn = $_SERVER['SERVER_NAME'];

                $uuid = DB::table('domains')
                    ->where('domain', $fqdn)
                    ->value('tenant_id');
            }
            return Cache::repository(new RedisStore(
                $app['redis'],
                $uuid,
                $app['config']['cache.stores.redis.connection']
            ));
        });
    }
}