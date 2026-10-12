<?php

try { $host = app('request')->getHost(); $current_hostname = $host ? \App\Models\System\Domain::where('domain', $host)->first() : null; } catch (\Throwable $_e) { $current_hostname = null; }

if($current_hostname)
{
    Route::domain($current_hostname->domain)->group(function () {

        Route::middleware(['auth', 'locked.tenant'])->group(function () {

            Route::prefix('live-app')->group(function() {

                Route::get('/', 'LiveAppController@index')->name('tenant.liveapp.index');
                // Route::get('/premium', 'LiveAppController@premium')->name('tenant.liveapp.premium');
                Route::get('/configuration', 'LiveAppController@configuration')->name('tenant.liveapp.configuration');

            });


            Route::prefix('app-configurations')->group(function () {

                Route::get('record', 'AppConfigurationController@record');
                Route::post('', 'AppConfigurationController@store');

            });

            Route::prefix('app-permissions')->group(function () {

                Route::get('record/{user_id}', 'AppPermissionController@record');
                Route::get('tables', 'AppPermissionController@tables');
                Route::post('', 'AppPermissionController@store');

            });
        });

    });

}