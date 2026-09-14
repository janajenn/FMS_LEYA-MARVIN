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
    Schema::table('users', function (Blueprint $table) {
        $table->string('qr_code')->nullable()->unique()->after('email');
        $table->boolean('is_employee')->default(false)->after('qr_code');
        $table->string('employee_number')->nullable()->unique()->after('is_employee');
        // other fields like position, department? optional
    });
}

public function down()
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['qr_code', 'is_employee', 'employee_number']);
    });
}

    /**
     * Reverse the migrations.
     */

};
