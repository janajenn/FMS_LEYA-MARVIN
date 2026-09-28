<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('employee_number')->unique()->after('id');
            $table->string('name')->after('employee_number');
            $table->string('contact_number')->nullable()->after('name');
            $table->string('position')->nullable()->after('contact_number');

            // Kept for future attendance / payroll. Not shown on the create form.
            $table->decimal('daily_rate', 10, 2)->nullable()->after('position');

            $table->boolean('is_active')->default(true)->after('daily_rate');
            $table->text('notes')->nullable()->after('is_active');

            $table->index('position');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['position']);
            $table->dropIndex(['is_active']);
            $table->dropUnique(['employee_number']);
            $table->dropColumn([
                'employee_number',
                'name',
                'contact_number',
                'position',
                'daily_rate',
                'is_active',
                'notes',
            ]);
        });
    }
};
