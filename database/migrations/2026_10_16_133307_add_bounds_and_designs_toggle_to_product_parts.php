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
    Schema::table('product_parts', function (Blueprint $table) {
        // Per-dimension min/max in inches, e.g.
        // { "length": { "min": 10, "max": 40 }, "width": { "min": 2, "max": 6 } }
        $table->json('dimension_bounds')->nullable()->after('is_customizable');

        // Second toggle: whether the customer can pick a design variant.
        $table->boolean('allow_design_selection')->default(false)->after('dimension_bounds');
    });
}

public function down(): void
{
    Schema::table('product_parts', function (Blueprint $table) {
        $table->dropColumn(['dimension_bounds', 'allow_design_selection']);
    });
}
};
