<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_part_designs', function (Blueprint $table) {
            // Stores the extra fee for selecting this design. Defaults to 0.
            $table->decimal('additional_cost', 10, 2)->default(0)->after('image_path');
        });
    }

    public function down(): void
    {
        Schema::table('product_part_designs', function (Blueprint $table) {
            $table->dropColumn('additional_cost');
        });
    }
};
