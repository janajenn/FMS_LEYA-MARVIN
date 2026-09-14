<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_no')->unique();
            $table->foreignId('requested_by')->constrained('users');
            $table->enum('procurement_type', ['supplier_purchase', 'walk_in_purchase']);
            $table->foreignId('supplier_id')->nullable()->constrained();
            $table->text('reason');
            $table->enum('status', ['pending_review', 'approved', 'rejected', 'returned_for_revision'])->default('pending_review');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_requests');
    }
};
