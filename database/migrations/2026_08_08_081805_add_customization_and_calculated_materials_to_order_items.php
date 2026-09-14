<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('order_items', function (Blueprint $table) {
            // Add customization_data if it doesn't exist (check your schema)
            if (!Schema::hasColumn('order_items', 'customization_data')) {
                $table->json('customization_data')->nullable()->after('price');
            }
            // Add calculated_materials
            $table->json('calculated_materials')->nullable()->after('customization_data');
        });
    }

    public function down()
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('calculated_materials');
            // Optionally drop customization_data if we added it
            // $table->dropColumn('customization_data');
        });
    }
};
