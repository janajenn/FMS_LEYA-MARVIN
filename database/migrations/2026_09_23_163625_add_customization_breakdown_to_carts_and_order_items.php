<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->json('customization_breakdown')
                ->nullable()
                ->after('customization_surcharge');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->json('customization_breakdown')
                ->nullable()
                ->after('customization_surcharge');
        });
    }

    public function down()
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn('customization_breakdown');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('customization_breakdown');
        });
    }
};
