<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('purchase_order_id')
                ->nullable()
                ->after('id')
                ->constrained('purchase_orders')
                ->nullOnDelete();

            // Prevent duplicate expense entries for the same PO
            $table->unique('purchase_order_id');
        });
    }

    public function down()
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropUnique(['purchase_order_id']);
            $table->dropForeign(['purchase_order_id']);
            $table->dropColumn('purchase_order_id');
        });
    }
};
