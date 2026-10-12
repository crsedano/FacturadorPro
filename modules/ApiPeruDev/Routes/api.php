<?php

use Illuminate\Support\Facades\Route;

try { $host = app('request')->getHost(); $current_hostname = $host ? \App\Models\System\Domain::where('domain', $host)->first() : null; } catch (\Throwable $_e) { $current_hostname = null; }

if($current_hostname) {
    Route::domain($current_hostname->domain)->group(function () {
        Route::middleware(['auth:api'])->group(function () {
            Route::prefix('service')->group(function () {
                Route::get('{type}/{number}', 'ServiceController@service');
            });
        });
    });
}
