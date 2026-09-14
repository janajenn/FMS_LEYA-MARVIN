<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // 1. Add 'accepted' to the 'status' ENUM
        //    First, check the current ENUM definition and alter it
        //    Using raw SQL because Doctrine doesn't support ENUM modification.
        DB::statement("ALTER TABLE orders MODIFY status ENUM('pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending'");

        // 2. Ensure payment_status column exists and has correct ENUM
        if (!Schema::hasColumn('orders', 'payment_status')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->enum('payment_status', ['pending', 'partially_paid', 'paid', 'failed', 'refunded'])
                    ->default('pending')
                    ->after('status');
            });
        } else {
            // If it exists, alter it to the correct ENUM (in case it's not defined)
            DB::statement("ALTER TABLE orders MODIFY payment_status ENUM('pending', 'partially_paid', 'paid', 'failed', 'refunded') DEFAULT 'pending'");
        }

        // 3. Update any existing pending orders to 'accepted' if payment is paid
        //    This ensures old orders get the correct status if needed
        DB::table('orders')
            ->where('status', 'pending')
            ->where('payment_status', 'paid')
            ->update(['status' => 'accepted']);
    }

    public function down()
    {
        // Rollback: revert status to previous ENUM without 'accepted'
        DB::statement("ALTER TABLE orders MODIFY status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending'");

        // Optionally drop payment_status, but careful not to lose data
        // We'll just leave it.
    }
};
