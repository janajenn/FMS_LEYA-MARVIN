<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_parts', function (Blueprint $table) {
            $table->decimal('standard_length',    10, 2)->nullable()->after('dimension_fields');
            $table->decimal('standard_width',     10, 2)->nullable()->after('standard_length');
            $table->decimal('standard_height',    10, 2)->nullable()->after('standard_width');
            $table->decimal('standard_thickness', 10, 2)->nullable()->after('standard_height');
            $table->decimal('standard_diameter',  10, 2)->nullable()->after('standard_thickness');
            $table->decimal('standard_depth',     10, 2)->nullable()->after('standard_diameter');
        });
    }

    public function down(): void
    {
        Schema::table('product_parts', function (Blueprint $table) {
            $table->dropColumn([
                'standard_length',
                'standard_width',
                'standard_height',
                'standard_thickness',
                'standard_diameter',
                'standard_depth',
            ]);
        });
    }
};
