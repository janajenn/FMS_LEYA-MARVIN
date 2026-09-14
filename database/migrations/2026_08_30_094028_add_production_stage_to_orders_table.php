<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('production_stage', [
                'carpentry',
                'sanding',
                'wood_filling',
                'varnishing',
                'completed'
            ])->nullable()->after('status');
        });

        // Optionally, set default for existing accepted/processing orders to 'carpentry'
        // but we'll handle that in code.
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('production_stage');
        });
    }
};
