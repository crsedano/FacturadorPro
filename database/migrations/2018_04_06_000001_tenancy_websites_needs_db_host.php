<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class TenancyWebsitesNeedsDbHost extends Migration
{
    public function up()
    {
        Schema::table('websites', function (Blueprint $table) {
            $table->string('managed_by_database_connection')
                ->nullable()
                ->comment('References the database connection key in your database.php');
        });
    }

    public function down()
    {
        Schema::table('websites', function (Blueprint $table) {
            $table->dropColumn('managed_by_database_connection');
        });
    }
}
