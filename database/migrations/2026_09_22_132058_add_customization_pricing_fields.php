<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // ── Products: standard reference size + markup ──
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('standard_length', 10, 2)->nullable()->after('price');
            $table->decimal('standard_width', 10, 2)->nullable()->after('standard_length');
            $table->decimal('standard_height', 10, 2)->nullable()->after('standard_width');
            $table->decimal('customization_markup_percent', 5, 2)->default(40.00)->after('standard_height');
        });

        // ── Cart items: store the computed surcharge per row ──
        Schema::table('carts', function (Blueprint $table) {
            $table->decimal('customization_surcharge', 10, 2)->default(0.00)->after('quantity');
        });

        // ── Order items: freeze the surcharge at the time of order ──
        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('customization_surcharge', 10, 2)->default(0.00)->after('price');
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'standard_length',
                'standard_width',
                'standard_height',
                'customization_markup_percent',
            ]);
        });

        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn('customization_surcharge');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('customization_surcharge');
        });
    }
};
