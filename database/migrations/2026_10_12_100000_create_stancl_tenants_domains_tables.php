<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'system';

    public function up(): void
    {
        Schema::connection('system')->create('tenants', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->json('data')->nullable();
            $table->timestamps();
        });

        Schema::connection('system')->create('domains', function (Blueprint $table) {
            $table->id();
            $table->string('domain')->unique();
            $table->string('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->timestamps();
        });

        // Populate tenants from existing websites
        $appKey = config('app.key');
        $websites = DB::connection('system')->table('websites')->whereNull('deleted_at')->get();
        foreach ($websites as $website) {
            $password = md5($appKey . '.' . $website->id);
            DB::connection('system')->table('tenants')->insert([
                'id' => $website->uuid,
                'data' => json_encode([
                    'tenancy_db_name' => $website->uuid,
                    'tenancy_db_username' => $website->uuid,
                    'tenancy_db_password' => $password,
                ]),
                'created_at' => $website->created_at,
                'updated_at' => $website->updated_at,
            ]);
        }

        // Populate domains from existing hostnames
        $hostnames = DB::connection('system')
            ->table('hostnames')
            ->join('websites', 'websites.id', '=', 'hostnames.website_id')
            ->whereNull('hostnames.deleted_at')
            ->whereNull('websites.deleted_at')
            ->select('hostnames.fqdn', 'websites.uuid as tenant_id', 'hostnames.created_at', 'hostnames.updated_at')
            ->get();
        foreach ($hostnames as $hostname) {
            DB::connection('system')->table('domains')->insert([
                'domain' => $hostname->fqdn,
                'tenant_id' => $hostname->tenant_id,
                'created_at' => $hostname->created_at,
                'updated_at' => $hostname->updated_at,
            ]);
        }

        // Add tenant_id to clients table
        Schema::connection('system')->table('clients', function (Blueprint $table) {
            $table->string('tenant_id')->nullable()->after('hostname_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('set null');
        });

        // Populate clients.tenant_id from hostname → website → uuid
        DB::connection('system')->statement('
            UPDATE clients c
            JOIN hostnames h ON h.id = c.hostname_id
            JOIN websites w ON w.id = h.website_id
            SET c.tenant_id = w.uuid
            WHERE c.hostname_id IS NOT NULL
        ');
    }

    public function down(): void
    {
        Schema::connection('system')->table('clients', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
        Schema::connection('system')->dropIfExists('domains');
        Schema::connection('system')->dropIfExists('tenants');
    }
};
