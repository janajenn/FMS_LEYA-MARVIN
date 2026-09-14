<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // For MySQL, we can use a raw statement to change the column type
        // because `change()` may not work with TEXT types in some versions.
        DB::statement('ALTER TABLE product_parts MODIFY reference_image LONGTEXT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE product_parts MODIFY reference_image VARCHAR(255) NULL');
    }
};
