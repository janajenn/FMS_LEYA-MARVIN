<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('product_material', function (Blueprint $table) {
            // New columns for dynamic BOM
            $table->enum('calculation_type', ['fixed', 'calculated'])->default('fixed');
            $table->text('formula')->nullable();
            $table->decimal('coverage_rate', 10, 3)->nullable();
            $table->boolean('is_finish')->default(false);
            $table->integer('sort_order')->default(0);

            // The 'quantity' column already exists and will be used for fixed materials.
        });
    }

    public function down()
    {
        Schema::table('product_material', function (Blueprint $table) {
            $table->dropColumn(['calculation_type', 'formula', 'coverage_rate', 'is_finish', 'sort_order']);
        });
    }
};
