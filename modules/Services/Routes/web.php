<?php

use Illuminate\Support\Facades\Route;

try { $host = app('request')->getHost(); $current_hostname = $host ? \App\Models\System\Domain::where('domain', $host)->first() : null; } catch (\Throwable $_e) { $current_hostname = null; }

if ($current_hostname) {
    Route::domain($current_hostname->domain)->group(function () {
        Route::middleware(['auth', 'locked.tenant'])->group(function () {
            Route::prefix('services')->group(function () {
                Route::get('exchange/{date}', 'ServiceController@exchange');
            });
        });
    });
}
