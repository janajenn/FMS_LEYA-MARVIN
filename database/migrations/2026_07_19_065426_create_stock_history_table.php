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
    Schema::create('stock_history', function (Blueprint $table) {
        $table->id();
        $table->foreignId('material_id')->constrained();
        $table->string('reference_type'); // e.g., stock_in, adjustment, etc.
        $table->unsignedBigInteger('reference_id')->nullable();
        $table->decimal('quantity_change', 10, 2);
        $table->decimal('previous_quantity', 10, 2);
        $table->decimal('new_quantity', 10, 2);
        $table->text('note')->nullable();
        $table->foreignId('created_by')->constrained('users');
        $table->timestamps();

        $table->index(['reference_type', 'reference_id']);
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_history');
    }
};
