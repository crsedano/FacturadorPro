<?php


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

try { $host = app('request')->getHost(); $hostname = $host ? \App\Models\System\Domain::where('domain', $host)->first() : null; } catch (\Throwable $_e) { $hostname = null; }
if ($hostname) {
    Route::domain($hostname->domain)->group(function() {

        Route::middleware(['auth:api', 'locked.tenant'])->group(function() {

            Route::prefix('restaurant')->group(function () {
                Route::get('/items', 'RestaurantController@items');
                Route::get('/categories', 'RestaurantController@categories');
                Route::get('/configurations', 'RestaurantConfigurationController@record');
            });

        });

    });
}
