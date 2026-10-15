<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class TenantAddIndexDocumentIdToSaleNotes extends Migration
{
    public function up()
    {
        Schema::table('sale_notes', function (Blueprint $table) {
            $table->index('document_id');
        });
    }

    public function down()
    {
        Schema::table('sale_notes', function (Blueprint $table) {
            $table->dropIndex(['document_id']);
        });
    }
}
