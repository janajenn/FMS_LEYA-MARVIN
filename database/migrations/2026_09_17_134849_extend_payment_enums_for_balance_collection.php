<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // ✅ Extend `method` to include cash, gcash, paymongo, cash_on_delivery
        DB::statement("ALTER TABLE payments MODIFY method ENUM(
            'cash_on_delivery',
            'gcash',
            'paymongo',
            'cash'
        ) NOT NULL DEFAULT 'cash_on_delivery'");

        // ✅ Extend `type` to include full_payment and remaining_balance
        DB::statement("ALTER TABLE payments MODIFY type ENUM(
            'down_payment',
            'final_payment',
            'full_payment',
            'remaining_balance'
        ) NOT NULL DEFAULT 'down_payment'");
    }

    public function down()
    {
        DB::statement("ALTER TABLE payments MODIFY method ENUM(
            'cash_on_delivery',
            'gcash'
        ) NOT NULL DEFAULT 'cash_on_delivery'");

        DB::statement("ALTER TABLE payments MODIFY type ENUM(
            'down_payment',
            'final_payment'
        ) NOT NULL DEFAULT 'down_payment'");
    }
};
