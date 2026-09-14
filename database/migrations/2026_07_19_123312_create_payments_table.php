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
    Schema::create('payments', function (Blueprint $table) {
        $table->id();
        $table->foreignId('order_id')->constrained()->onDelete('cascade');
        $table->decimal('amount', 10, 2);
        $table->enum('method', ['cash_on_delivery', 'gcash'])->default('cash_on_delivery');
        $table->enum('status', ['pending', 'paid', 'failed'])->default('pending');
        $table->enum('type', ['down_payment', 'final_payment'])->default('down_payment');
        $table->string('transaction_id')->nullable();
        $table->string('reference_number')->nullable(); // for GCash reference
        $table->timestamp('paid_at')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
