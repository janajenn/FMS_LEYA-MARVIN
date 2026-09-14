<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('product_finish', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('material_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity_per_unit', 10, 3)->nullable(); // e.g., 0.500 litres
            $table->timestamps();

            // Prevent duplicate product-material pairs
            $table->unique(['product_id', 'material_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('product_finish');
    }
};
