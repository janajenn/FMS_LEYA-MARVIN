<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop old tables
        Schema::dropIfExists('customization_option_values');
        Schema::dropIfExists('customization_options');

        // Create product_parts table
        Schema::create('product_parts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('reference_image')->nullable();
            $table->json('dimension_fields'); // e.g., ["length", "width", "thickness"]
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_parts');
        // Recreate old tables if needed (optional)
        Schema::create('customization_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('type', ['select', 'radio'])->default('select');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
        Schema::create('customization_option_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customization_option_id')->constrained()->onDelete('cascade');
            $table->string('value');
            $table->decimal('price_adjustment', 10, 2)->default(0);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }
};
