<?php

try { $host = app('request')->getHost(); $current_hostname = $host ? \App\Models\System\Domain::where('domain', $host)->first() : null; } catch (\Throwable $_e) { $current_hostname = null; }

if($current_hostname) {
    Route::domain($current_hostname->domain)->group(function () {
        Route::middleware(['auth', 'redirect.module', 'locked.tenant'])->group(function () {


            Route::prefix('offline-configurations')->group(function () {

                Route::get('', 'OfflineConfigurationController@index')->name('tenant.offline_configurations.index')->middleware('redirect.level');
                Route::post('', 'OfflineConfigurationController@store');
                Route::get('record', 'OfflineConfigurationController@record');
            });

        });
    });
}
