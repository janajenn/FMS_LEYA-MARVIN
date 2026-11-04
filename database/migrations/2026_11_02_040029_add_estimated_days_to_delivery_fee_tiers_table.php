<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_fee_tiers', function (Blueprint $table) {
            $table->unsignedInteger('estimated_days')
                ->default(1)
                ->after('fee');
        });

        // Backfill: any existing tier gets the old global config value
        // so nothing suddenly shows "1 day" for every tier after deploy.
        $legacy = (int) config('store.estimated_days', 3);
        if ($legacy > 0) {
            DB::table('delivery_fee_tiers')->update(['estimated_days' => $legacy]);
        }
    }

    public function down(): void
    {
        Schema::table('delivery_fee_tiers', function (Blueprint $table) {
            $table->dropColumn('estimated_days');
        });
    }
};
