<?php

use Illuminate\Support\Facades\Route;

try { $host = app('request')->getHost(); $current_hostname = $host ? \App\Models\System\Domain::where('domain', $host)->first() : null; } catch (\Throwable $_e) { $current_hostname = null; }

if($current_hostname) {
    Route::domain($current_hostname->domain)->group(function () {
        Route::middleware(['auth', 'locked.tenant'])->group(function () {
            Route::prefix('store')->group(function () {
//                Route::get('quotation_to_document/{quotation}', 'StoreController@quotationToDocument');
                Route::get('record/{table}/{table_id}', 'StoreController@getRecord');
                Route::post('get_item_series', 'StoreController@getItemSeries');
                Route::post('get_igv', 'StoreController@getIgv');
            });
            Route::prefix('documents')->group(function () {
                Route::get('create/{table?}/{table_id?}', 'StoreController@tableToDocument');
            });
        });
    });
}
