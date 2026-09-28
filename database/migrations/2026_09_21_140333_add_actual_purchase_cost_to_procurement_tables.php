<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // ── Per-item actual cost ──
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->decimal('actual_unit_cost', 12, 2)
                ->nullable()
                ->after('ordered_quantity');
            $table->decimal('actual_subtotal', 12, 2)
                ->nullable()
                ->after('actual_unit_cost');
        });

        // ── Order-level totals & audit ──
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->decimal('actual_total_cost', 12, 2)
                ->nullable()
                ->after('status');
            $table->timestamp('purchase_recorded_at')
                ->nullable()
                ->after('actual_total_cost');
            $table->foreignId('purchase_recorded_by')
                ->nullable()
                ->after('purchase_recorded_at')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropColumn(['actual_unit_cost', 'actual_subtotal']);
        });
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign(['purchase_recorded_by']);
            $table->dropColumn([
                'actual_total_cost',
                'purchase_recorded_at',
                'purchase_recorded_by',
            ]);
        });
    }
};
