<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Raw SQL — avoids requiring doctrine/dbal on Laravel 10,
        // and works identically on Laravel 11+.
        DB::statement('ALTER TABLE `orders` MODIFY `user_id` BIGINT UNSIGNED NULL');
    }

    public function down(): void
    {
        // WARNING: if any kiosk orders exist with user_id = NULL, this will fail.
        // Only roll back in dev before kiosk orders exist.
        DB::statement('ALTER TABLE `orders` MODIFY `user_id` BIGINT UNSIGNED NOT NULL');
    }
};
