<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        DB::statement("ALTER TABLE product_material MODIFY calculation_rule ENUM(
            'fixed',
            'board_feet',
            'surface_area',
            'surface_area_coverage',
            'linear_feet',
            'custom'
        ) NULL DEFAULT 'fixed'");
    }

    public function down()
    {
        DB::statement("ALTER TABLE product_material MODIFY calculation_rule ENUM(
            'board_feet',
            'surface_area',
            'surface_area_coverage',
            'linear_feet',
            'custom'
        ) NULL DEFAULT NULL");
    }
};
