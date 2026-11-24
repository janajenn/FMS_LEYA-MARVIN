<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_runs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')
                ->constrained()
                ->restrictOnDelete();       // Q6: preserve audit trail

            $table->foreignId('variant_id')
                ->nullable()
                ->constrained('product_variants')
                ->nullOnDelete();           // variant is optional metadata

            $table->integer('quantity');

            $table->text('notes')->nullable();

            $table->foreignId('confirmed_by')
                ->constrained('users')
                ->restrictOnDelete();       // preserve who confirmed

            $table->timestamps();

            $table->index(['product_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_runs');
    }
};
