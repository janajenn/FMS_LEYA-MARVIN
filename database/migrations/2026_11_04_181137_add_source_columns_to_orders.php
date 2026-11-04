<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('source', ['web', 'kiosk'])
                  ->default('web')
                  ->after('user_id')
                  ->index();

            $table->string('kiosk_id')->nullable()->after('source');
            $table->string('customer_name')->nullable()->after('notes');
            $table->string('customer_phone', 20)->nullable()->after('customer_name');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['source']);
            $table->dropColumn(['source', 'kiosk_id', 'customer_name', 'customer_phone']);
        });
    }
};
