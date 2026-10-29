<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('product_parts', function (Blueprint $table) {
        // When false → the customer sees the part's standard dimensions as read-only.
        // When true  → the customer can edit each dimension_field they filled in.
        $table->boolean('is_customizable')->default(false)->after('dimension_fields');
    });
}

public function down(): void
{
    Schema::table('product_parts', function (Blueprint $table) {
        $table->dropColumn('is_customizable');
    });
}
};
