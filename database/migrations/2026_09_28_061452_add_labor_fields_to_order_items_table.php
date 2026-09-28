<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // Who's actually building this line
            $table->foreignId('assigned_employee_id')
                ->nullable()
                ->after('variant_id')
                ->constrained('employees')
                ->nullOnDelete();

            // Snapshot of labor cost AT ORDER TIME — frozen forever
            $table->decimal('labor_cost', 10, 2)->nullable()->after('price');

            // Lifecycle: pending → assigned → in_progress → completed
            $table->string('labor_status')->default('pending')->after('labor_cost');

            // Audit trail
            $table->foreignId('assigned_by')
                ->nullable()
                ->after('labor_status')
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('assigned_at')->nullable()->after('assigned_by');
            $table->timestamp('labor_completed_at')->nullable()->after('assigned_at');

            $table->index(['labor_status', 'assigned_employee_id']);
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['assigned_employee_id']);
            $table->dropForeign(['assigned_by']);
            $table->dropIndex(['labor_status', 'assigned_employee_id']);
            $table->dropColumn([
                'assigned_employee_id',
                'labor_cost',
                'labor_status',
                'assigned_by',
                'assigned_at',
                'labor_completed_at',
            ]);
        });
    }
};
