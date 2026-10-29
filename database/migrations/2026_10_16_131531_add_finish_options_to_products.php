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
    Schema::table('products', function (Blueprint $table) {
        // Extra charge applied when the customer picks Standard.
        $table->decimal('standard_finish_surcharge', 10, 2)->default(0)->after('price');

        // Which finish material (varnish) is used for the Standard option.
        $table->foreignId('finish_material_id')->nullable()->after('standard_finish_surcharge')
            ->constrained('materials')->nullOnDelete();
    });
}

public function down(): void
{
    Schema::table('products', function (Blueprint $table) {
        $table->dropForeign(['finish_material_id']);
        $table->dropColumn(['finish_material_id', 'standard_finish_surcharge']);
    });
}
};
