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
    Schema::create('product_part_designs', function (Blueprint $table) {
        $table->id();
        $table->foreignId('product_part_id')
            ->constrained('product_parts')
            ->cascadeOnDelete();
        $table->string('name');
        $table->string('image_path');
        $table->boolean('is_default')->default(false);
        $table->boolean('is_active')->default(true);
        $table->unsignedInteger('sort_order')->default(0);
        $table->timestamps();

        $table->index(['product_part_id', 'is_active']);
    });
}

public function down(): void
{
    Schema::dropIfExists('product_part_designs');
}


};
