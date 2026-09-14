<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Alter the 'method' column to include 'paymongo'
        DB::statement("ALTER TABLE payments MODIFY method ENUM('cash_on_delivery', 'gcash', 'paymongo') DEFAULT 'cash_on_delivery'");
    }

    public function down()
    {
        // Revert to original (if needed)
        DB::statement("ALTER TABLE payments MODIFY method ENUM('cash_on_delivery', 'gcash') DEFAULT 'cash_on_delivery'");
    }
};
