<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->foreignId('material_id')
                ->nullable()
                ->after('product_id')
                ->constrained('materials')
                ->nullOnDelete();

            $table->index(['product_id', 'material_id']);
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropForeign(['material_id']);
            $table->dropIndex(['product_id', 'material_id']);
            $table->dropColumn('material_id');
        });
    }
};
