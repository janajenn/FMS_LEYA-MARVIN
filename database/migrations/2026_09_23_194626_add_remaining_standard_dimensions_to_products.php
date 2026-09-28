<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            // All nullable — only filled for products that use them
            if (!Schema::hasColumn('products', 'standard_thickness')) {
                $table->decimal('standard_thickness', 8, 2)->nullable()->after('standard_height');
            }
            if (!Schema::hasColumn('products', 'standard_diameter')) {
                $table->decimal('standard_diameter', 8, 2)->nullable()->after('standard_thickness');
            }
            if (!Schema::hasColumn('products', 'standard_depth')) {
                $table->decimal('standard_depth', 8, 2)->nullable()->after('standard_diameter');
            }
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'standard_thickness',
                'standard_diameter',
                'standard_depth',
            ]);
        });
    }
};
