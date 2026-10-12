<?php

try { $host = app('request')->getHost(); $hostname = $host ? \App\Models\System\Domain::where('domain', $host)->first() : null; } catch (\Throwable $_e) { $hostname = null; }

if ($hostname) 
{
    Route::domain($hostname->domain)->group(function () {

        Route::middleware(['auth:api', 'locked.tenant'])->group(function () {

            Route::prefix('items')->group(function () {
                
                // Route::post('update', 'Api\ItemController@update');

            });

        }); 
    });
} 
