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
        Schema::table('product_material', function (Blueprint $table) {
    $table->enum('calculation_rule', ['board_feet', 'surface_area', 'surface_area_coverage', 'linear_feet', 'custom'])
          ->nullable()
          ->after('calculation_type');
    // coverage_rate already exists
    // formula can be kept for 'custom' rule
});
        //
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
