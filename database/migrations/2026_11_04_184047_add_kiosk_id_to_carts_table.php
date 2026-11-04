<?php

// database/migrations/xxxx_add_kiosk_id_to_carts_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            // Nullable because normal web/mobile carts don't use this
            $table->string('kiosk_id')->nullable()->after('user_id')->index();
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn('kiosk_id');
        });
    }
};
