<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Make purchase_orders.supplier_id nullable so walk-in purchases
     * (unregistered suppliers) can be recorded without a supplier.
     */
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            // Drop the FK first (if it exists). MySQL/SQLite won't let us
            // change the column type while a foreign key depends on it.
            try {
                $table->dropForeign(['supplier_id']);
            } catch (\Throwable $e) {
                // No FK present — safe to ignore.
            }

            $table->unsignedBigInteger('supplier_id')->nullable()->change();

            // Re-add the FK with nullOnDelete so deleting a supplier
            // doesn't block or cascade-delete the PO.
            $table->foreign('supplier_id')
                ->references('id')->on('suppliers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            try {
                $table->dropForeign(['supplier_id']);
            } catch (\Throwable $e) {
                // ignore
            }

            $table->unsignedBigInteger('supplier_id')->nullable(false)->change();

            $table->foreign('supplier_id')
                ->references('id')->on('suppliers')
                ->restrictOnDelete();
        });
    }
};
