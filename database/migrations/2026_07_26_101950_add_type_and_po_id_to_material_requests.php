<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('material_requests', function (Blueprint $table) {
            $table->enum('type', ['regular', 'replacement'])->default('regular')->after('status');
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->onDelete('set null')->after('type');
        });
    }

    public function down()
    {
        Schema::table('material_requests', function (Blueprint $table) {
            $table->dropForeign(['purchase_order_id']);
            $table->dropColumn(['type', 'purchase_order_id']);
        });
    }
};
