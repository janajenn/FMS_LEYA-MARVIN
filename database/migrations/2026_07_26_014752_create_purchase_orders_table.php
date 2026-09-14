<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique();
            $table->foreignId('material_request_id')->constrained();
            $table->foreignId('supplier_id')->constrained();
            $table->foreignId('approved_by')->constrained('users');
            $table->timestamp('approved_at');
            $table->enum('status', ['waiting_delivery', 'partially_delivered', 'completed', 'cancelled'])->default('waiting_delivery');
            $table->date('expected_delivery')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
