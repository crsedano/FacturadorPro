<?php

try { $host = app('request')->getHost(); $hostname = $host ? \App\Models\System\Domain::where('domain', $host)->first() : null; } catch (\Throwable $_e) { $hostname = null; }

if($hostname) 
{
    Route::domain($hostname->domain)->group(function () {

        Route::get('client-errors/records', 'ClientErrorController@records');
         
        Route::prefix('transactions')->group(function () {
            Route::post('', 'TransactionController@store');
        });

        Route::middleware(['auth', 'locked.tenant'])->group(function() {

        });

    });
}

