<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop old FK if it exists (ignore if it doesn't)
        if (Schema::hasColumn('deliveries', 'delivery_zone_id')) {
            try {
                Schema::table('deliveries', fn (Blueprint $t) => $t->dropForeign(['delivery_zone_id']));
            } catch (\Throwable $e) {
                // No FK constraint — column only
            }

            Schema::table('deliveries', fn (Blueprint $t) => $t->dropColumn('delivery_zone_id'));
        }

        Schema::dropIfExists('delivery_zones');

        Schema::table('deliveries', function (Blueprint $table) {
            $table->foreignId('delivery_fee_tier_id')
                ->nullable()
                ->after('driver_id')
                ->constrained('delivery_fee_tiers')
                ->nullOnDelete();
            $table->decimal('distance_km', 6, 2)->nullable()->after('delivery_fee_tier_id');
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropForeign(['delivery_fee_tier_id']);
            $table->dropColumn(['delivery_fee_tier_id', 'distance_km']);
        });
        // Old `delivery_zones` table not restored — data is gone
    }
};
