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
    Schema::create('orders', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained();
        $table->string('order_number')->unique();
        $table->decimal('total', 10, 2);
        $table->enum('status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])->default('pending');
        $table->enum('payment_status', ['pending', 'partial_paid', 'paid', 'failed'])->default('pending');
        $table->text('shipping_address');
        $table->string('delivery_zone')->nullable(); // placeholder for zone
        $table->decimal('delivery_fee', 10, 2)->default(0);
        $table->text('notes')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
