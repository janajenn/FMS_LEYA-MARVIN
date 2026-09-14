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
    Schema::create('deliveries', function (Blueprint $table) {
        $table->id();
        $table->foreignId('order_id')->constrained()->onDelete('cascade');
        $table->foreignId('driver_id')->nullable()->constrained('users')->onDelete('set null');
        $table->foreignId('delivery_zone_id')->nullable()->constrained();
        $table->string('tracking_number')->unique();
        $table->enum('status', ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'])->default('pending');
        $table->text('proof_image')->nullable(); // path to uploaded photo
        $table->text('notes')->nullable();
        $table->timestamp('assigned_at')->nullable();
        $table->timestamp('picked_up_at')->nullable();
        $table->timestamp('delivered_at')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
