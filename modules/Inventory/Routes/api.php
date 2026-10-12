<?php

try { $host = app('request')->getHost(); $hostname = $host ? \App\Models\System\Domain::where('domain', $host)->first() : null; } catch (\Throwable $_e) { $hostname = null; }

if($hostname) {
    Route::domain($hostname->domain)->group(function () {
        
        Route::middleware(['auth:api', 'redirect.module', 'locked.tenant'])->group(function() {


            Route::prefix('inventory')->group(function () {

                Route::post('/transaction', 'Api\InventoryController@store_transaction');

            });


        });
    });
}
