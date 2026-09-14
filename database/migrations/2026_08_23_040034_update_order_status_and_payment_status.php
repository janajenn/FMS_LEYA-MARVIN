<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // 1. Change `status` column to a proper ENUM
        Schema::table('orders', function (Blueprint $table) {
            // Drop the old column and recreate it with correct ENUM
            // We need to use raw SQL because ENUM modification is tricky with Doctrine
            // First, create a new temporary column
            $table->string('status_temp')->nullable();
        });

        // Copy data
        DB::statement('UPDATE orders SET status_temp = status');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
                ->default('pending')
                ->after('total');
        });

        // Copy back
        DB::statement('UPDATE orders SET status = status_temp');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('status_temp');
        });

        // 2. Ensure `payment_status` exists and is correct ENUM
        // If payment_status already exists, we need to alter it
        // If it doesn't exist, we create it
        if (!Schema::hasColumn('orders', 'payment_status')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->enum('payment_status', ['pending', 'partially_paid', 'paid', 'failed', 'refunded'])
                    ->default('pending')
                    ->after('status');
            });
        } else {
            // If it exists, alter it to the correct ENUM
            // Use raw SQL to alter ENUM
            DB::statement("ALTER TABLE orders MODIFY payment_status ENUM('pending', 'partially_paid', 'paid', 'failed', 'refunded') DEFAULT 'pending'");
        }
    }

    public function down()
    {
        // Rollback is complex; we'll just drop and recreate if needed
        // But we'll not implement a full down for simplicity
    }
};
