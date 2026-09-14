<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('delivery_zones', function (Blueprint $table) {
            $table->enum('fee_type', ['free', 'fixed'])->default('fixed')->after('fee');
            $table->decimal('latitude', 10, 8)->nullable()->after('fee_type');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            // optional radius (in km) if you want to define a circular zone
            $table->decimal('radius', 8, 2)->nullable()->after('longitude');
        });
    }

    public function down()
    {
        Schema::table('delivery_zones', function (Blueprint $table) {
            $table->dropColumn(['fee_type', 'latitude', 'longitude', 'radius']);
        });
    }
};
