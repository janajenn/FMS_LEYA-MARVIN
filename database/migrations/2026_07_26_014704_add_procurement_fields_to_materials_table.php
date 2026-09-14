<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->enum('procurement_type', ['supplier_purchase', 'walk_in_purchase'])->nullable()->after('supplier_id');
            $table->decimal('reorder_level', 10, 2)->nullable()->after('procurement_type');
            $table->enum('status', ['active', 'inactive'])->default('active')->after('reorder_level');
        });
    }

    public function down(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->dropColumn(['procurement_type', 'reorder_level', 'status']);
        });
    }
};
