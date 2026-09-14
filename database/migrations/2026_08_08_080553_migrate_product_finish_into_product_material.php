<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasTable('product_finish')) {
            // Migrate data
            $finishes = DB::table('product_finish')->get();
            foreach ($finishes as $finish) {
                $exists = DB::table('product_material')
                    ->where('product_id', $finish->product_id)
                    ->where('material_id', $finish->material_id)
                    ->exists();

                if (!$exists) {
                    DB::table('product_material')->insert([
                        'product_id' => $finish->product_id,
                        'material_id' => $finish->material_id,
                        'quantity' => $finish->quantity_per_unit ?? 0,
                        'unit' => null,
                        'calculation_type' => 'fixed',
                        'is_finish' => true,
                        'sort_order' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // Drop the old table
            Schema::dropIfExists('product_finish');
        }
    }

    public function down()
    {
        // Recreate product_finish table (only for rollback safety, without data)
        if (!Schema::hasTable('product_finish')) {
            Schema::create('product_finish', function ($table) {
                $table->id();
                $table->foreignId('product_id')->constrained()->onDelete('cascade');
                $table->foreignId('material_id')->constrained()->onDelete('cascade');
                $table->decimal('quantity_per_unit', 10, 3)->nullable();
                $table->timestamps();
                $table->unique(['product_id', 'material_id']);
            });
            // Data loss is acceptable in rollback – we're just ensuring the table exists.
        }
    }
};
