<?php

namespace Modules\Account\Http\Controllers\System;

use App\Http\Controllers\Controller;
use Exception;
use App\Http\Resources\System\ClientCollection;
use App\Models\System\Client;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Models\System\Configuration;
use Modules\Account\Http\Controllers\AccountController;

class AccountingController extends Controller
{

    public function index()
    {
        return view('account::system.accounting.index');
    }
  

    public function records()
    {
        $records = Client::latest()->get(); 
        return new ClientCollection($records);
    }

    public function download(Request $request)
    {
        
        $client = Client::findOrFail($request->id);
        tenancy()->initialize($client->tenant);
        $result = app(AccountController::class)->download($request);
        tenancy()->end();

        return $result;
    
    }

}
