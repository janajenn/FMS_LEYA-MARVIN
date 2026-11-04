<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_fee_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('label', 100);
            $table->decimal('min_distance_km', 6, 2);
            $table->decimal('max_distance_km', 6, 2)->nullable(); // null = ∞
            $table->decimal('fee', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'min_distance_km']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_fee_tiers');
    }
};
