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
    Schema::create('stock_in', function (Blueprint $table) {
        $table->id();
        $table->foreignId('material_id')->constrained();
        $table->foreignId('supplier_id')->constrained();
        $table->decimal('quantity', 10, 2);
        $table->decimal('unit_cost', 10, 2);
        $table->decimal('total_cost', 10, 2)->storedAs('quantity * unit_cost');
        $table->date('date_received');
        $table->text('notes')->nullable();
        $table->foreignId('user_id')->constrained();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_in');
    }
};
