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
    Schema::create('customization_option_values', function (Blueprint $table) {
        $table->id();
        $table->foreignId('customization_option_id')->constrained()->onDelete('cascade');
        $table->string('value');
        $table->decimal('price_adjustment', 10, 2)->default(0);
        $table->integer('sort_order')->default(0);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customization_option_values');
    }
};
