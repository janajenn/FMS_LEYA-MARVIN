<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_size_templates', function (Blueprint $table) {
            $table->id();

            $table->foreignId('category_id')
                ->constrained('product_categories')
                ->cascadeOnDelete();

            $table->string('label');

            $table->decimal('length',    10, 2)->nullable();
            $table->decimal('width',     10, 2)->nullable();
            $table->decimal('height',    10, 2)->nullable();
            $table->decimal('thickness', 10, 2)->nullable();
            $table->decimal('diameter',  10, 2)->nullable();
            $table->decimal('depth',     10, 2)->nullable();

            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['category_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_size_templates');
    }
};
