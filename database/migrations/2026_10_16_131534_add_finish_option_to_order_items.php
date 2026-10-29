<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
{
    Schema::table('order_items', function (Blueprint $table) {
        $table->string('finish_option')->default('ordinary')->after('variant_id'); // 'ordinary' | 'standard'
        $table->decimal('finish_surcharge', 10, 2)->default(0)->after('finish_option');
    });
}

public function down(): void
{
    Schema::table('order_items', function (Blueprint $table) {
        $table->dropColumn(['finish_option', 'finish_surcharge']);
    });
}
};
