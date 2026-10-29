<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_parts', function (Blueprint $table) {
            // Stores pricing per inch for each dimension, e.g. { "length": 15.00, "width": 25.00 }
            $table->json('dimension_pricing')->nullable()->after('dimension_bounds');
        });
    }

    public function down(): void
    {
        Schema::table('product_parts', function (Blueprint $table) {
            $table->dropColumn('dimension_pricing');
        });
    }
};
