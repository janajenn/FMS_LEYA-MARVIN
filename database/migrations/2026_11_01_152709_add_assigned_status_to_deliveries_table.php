<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Read the current enum definition so we don't clobber values
        $col = DB::selectOne("SHOW COLUMNS FROM deliveries WHERE Field = 'status'");
        if (!$col) {
            throw new \RuntimeException('deliveries.status column not found');
        }

        preg_match_all("/'([^']+)'/", $col->Type, $matches);
        $existing = $matches[1] ?? [];

        if (in_array('assigned', $existing, true)) {
            return; // already added — idempotent
        }

        // Preserve original order, insert 'assigned' right after 'pending'
        $newValues = [];
        foreach ($existing as $v) {
            $newValues[] = $v;
            if ($v === 'pending') {
                $newValues[] = 'assigned';
            }
        }
        // Edge case: if 'pending' wasn't present, append at end
        if (!in_array('assigned', $newValues, true)) {
            $newValues[] = 'assigned';
        }

        $enumList = implode(',', array_map(fn ($v) => "'" . str_replace("'", "''", $v) . "'", $newValues));

        DB::statement("ALTER TABLE deliveries MODIFY COLUMN status ENUM({$enumList}) NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        // Only safe to remove 'assigned' if no rows currently use it
        $inUse = DB::table('deliveries')->where('status', 'assigned')->exists();
        if ($inUse) {
            throw new \RuntimeException(
                'Cannot roll back — there are deliveries with status="assigned". ' .
                'Update them first (e.g., to "pending") before rolling back.'
            );
        }

        $col = DB::selectOne("SHOW COLUMNS FROM deliveries WHERE Field = 'status'");
        preg_match_all("/'([^']+)'/", $col->Type, $matches);
        $existing = $matches[1] ?? [];

        $reverted = array_values(array_filter($existing, fn ($v) => $v !== 'assigned'));
        if (empty($reverted)) {
            return;
        }

        $enumList = implode(',', array_map(fn ($v) => "'" . str_replace("'", "''", $v) . "'", $reverted));

        DB::statement("ALTER TABLE deliveries MODIFY COLUMN status ENUM({$enumList}) NOT NULL DEFAULT 'pending'");
    }
};