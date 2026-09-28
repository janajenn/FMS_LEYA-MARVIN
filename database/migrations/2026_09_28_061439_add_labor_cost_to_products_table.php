<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Baseline labor cost used to price the product
            // and to snapshot onto order items when ordered
            $table->decimal('labor_cost', 10, 2)->nullable()->after('price');

            // Optional but useful for pricing sanity checks
            $table->decimal('estimated_labor_hours', 6, 2)->nullable()->after('labor_cost');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['labor_cost', 'estimated_labor_hours']);
        });
    }
};
