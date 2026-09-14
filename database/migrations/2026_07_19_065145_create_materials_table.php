<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('materials', function (Blueprint $table) {
        $table->id();
       $table->foreignId('category_id')
      ->constrained('material_categories')
      ->cascadeOnDelete();
        $table->string('name');
        $table->string('unit');
        $table->decimal('cost', 10, 2);
        $table->decimal('stock_quantity', 10, 2)->default(0);
        $table->json('attributes')->nullable(); // extra specs
        $table->foreignId('supplier_id')->nullable()->constrained(); // default supplier
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('materials');
    }
};
