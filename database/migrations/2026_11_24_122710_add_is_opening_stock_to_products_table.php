<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_opening_stock')
                ->default(true)
                ->after('stock_quantity');
        });

        // Explicit backfill for clarity — every existing product is
        // treated as opening inventory, since none of them were
        // material-accounted at creation time.
        DB::table('products')->update(['is_opening_stock' => true]);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('is_opening_stock');
        });
    }
};
