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
    Schema::create('payrolls', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained();
        $table->date('period_start');
        $table->date('period_end');
        $table->integer('total_days_worked')->default(0);
        $table->decimal('total_hours_worked', 8, 2)->default(0);
        $table->decimal('daily_rate', 10, 2)->default(0);
        $table->decimal('basic_salary', 10, 2)->default(0);
        $table->decimal('overtime_pay', 10, 2)->default(0);
        $table->decimal('deductions', 10, 2)->default(0);
        $table->decimal('gross_salary', 10, 2)->default(0);
        $table->decimal('net_salary', 10, 2)->default(0);
        $table->enum('status', ['pending', 'approved', 'paid'])->default('pending');
        $table->timestamp('paid_at')->nullable();
        $table->text('notes')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
