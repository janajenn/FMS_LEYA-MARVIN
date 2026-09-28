<?php

namespace App\Console\Commands;

use App\Models\Expense;
use App\Models\PurchaseOrder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;

class BackfillPurchaseExpenses extends Command
{
    protected $signature = 'expenses:backfill-purchases';
    protected $description = 'Create Expense records for POs that already have a recorded actual cost.';

    public function handle()
    {
        $pos = PurchaseOrder::whereNotNull('actual_total_cost')
            ->whereDoesntHave('expense')   // ensure relation exists
            ->with(['materialRequest', 'supplier'])
            ->get();

        if ($pos->isEmpty()) {
            $this->info('Nothing to backfill — all POs already have expense records.');
            return;
        }

        $count = 0;

        foreach ($pos as $po) {
            $descriptionParts = ["Purchase Order #{$po->po_number}"];

            if ($po->materialRequest) {
                $descriptionParts[] = "for Material Request #{$po->materialRequest->request_no}";
            }
            if ($po->supplier) {
                $descriptionParts[] = "· Supplier: {$po->supplier->name}";
            }

            Expense::updateOrCreate(
                ['purchase_order_id' => $po->id],
                [
                    'category'         => 'supplier_purchase',
                    'description'      => implode(' ', $descriptionParts),
                    'amount'           => $po->actual_total_cost,
                    'expense_date'     => $po->purchase_recorded_at?->toDateString() ?? now()->toDateString(),
                    'recorded_by'      => $po->purchase_recorded_by,
                    'reference_number' => $po->po_number,
                ]
            );

            $count++;
            $this->line("✓ PO #{$po->po_number} → ₱" . number_format($po->actual_total_cost, 2));
        }

        $this->info("Backfilled {$count} expense record(s).");
    }
}
