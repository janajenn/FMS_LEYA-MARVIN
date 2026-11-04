<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_part_designs', function (Blueprint $table) {
            $table->decimal('additional_labor_cost', 10, 2)
                ->default(0)
                ->after('additional_cost');
        });
    }

    public function down(): void
    {
        Schema::table('product_part_designs', function (Blueprint $table) {
            $table->dropColumn('additional_labor_cost');
        });
    }
};
