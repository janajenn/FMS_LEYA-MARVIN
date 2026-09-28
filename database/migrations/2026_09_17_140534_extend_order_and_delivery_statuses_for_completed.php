<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        DB::statement("ALTER TABLE orders MODIFY status ENUM(
            'pending','accepted','processing','shipped','delivered','completed','cancelled'
        ) NOT NULL DEFAULT 'pending'");

        DB::statement("ALTER TABLE deliveries MODIFY status ENUM(
            'pending','picked_up','in_transit','delivered','completed','failed'
        ) NOT NULL DEFAULT 'pending'");
    }

    public function down()
    {
        DB::statement("ALTER TABLE orders MODIFY status ENUM(
            'pending','accepted','processing','shipped','delivered','cancelled'
        ) NOT NULL DEFAULT 'pending'");

        DB::statement("ALTER TABLE deliveries MODIFY status ENUM(
            'pending','picked_up','in_transit','delivered','failed'
        ) NOT NULL DEFAULT 'pending'");
    }
};
