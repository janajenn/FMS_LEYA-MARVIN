<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Expense;
use App\Models\GoodsReceipt;
use App\Models\Material;
use App\Models\MaterialRequest;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // ═══════════════════════════════════════════════════════
        // 1. TODAY'S SNAPSHOT
        // ═══════════════════════════════════════════════════════
        $todayStart = now()->startOfDay();
        $todayEnd   = now()->endOfDay();

        $ordersToday = Order::whereBetween('created_at', [$todayStart, $todayEnd])->count();

        $revenueToday = (float) Payment::where('status', 'paid')
            ->whereBetween('paid_at', [$todayStart, $todayEnd])
            ->sum('amount');

        $expensesToday = (float) Expense::whereBetween('expense_date', [$todayStart, $todayEnd])
            ->sum('amount');

        // ═══════════════════════════════════════════════════════
        // 2. ORDER OPERATIONS
        // ═══════════════════════════════════════════════════════
        $orderStatusCounts = Order::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $ordersPending    = ($orderStatusCounts['pending']    ?? 0)
                          + ($orderStatusCounts['accepted']   ?? 0);
        $ordersProcessing = $orderStatusCounts['processing'] ?? 0;
        $ordersShipped    = $orderStatusCounts['shipped']    ?? 0;
        $ordersDelivered  = $orderStatusCounts['delivered']  ?? 0;
        $ordersTotal      = array_sum($orderStatusCounts);

        // ═══════════════════════════════════════════════════════
        // 3. PRODUCTION PIPELINE
        // ═══════════════════════════════════════════════════════
        $productionPipeline = Order::where('status', 'processing')
            ->select('production_stage', DB::raw('COUNT(*) as total'))
            ->groupBy('production_stage')
            ->pluck('total', 'production_stage')
            ->toArray();

        // Orders stuck in production for too long (14+ days)
        $staleOrders = Order::where('status', 'processing')
            ->where('updated_at', '<=', now()->subDays(14))
            ->with('user')
            ->orderBy('updated_at', 'asc')
            ->limit(5)
            ->get()
            ->map(fn ($o) => [
                'id'              => $o->id,
                'order_number'    => $o->order_number,
                'customer'        => $o->user?->name ?? 'Unknown',
                'production_stage' => $o->production_stage,
                'days_in_stage'   => (int) $o->updated_at->diffInDays(now()),
            ]);

        // ═══════════════════════════════════════════════════════
        // 4. PROCUREMENT MONITORING
        // ═══════════════════════════════════════════════════════
        $mrStatusCounts = MaterialRequest::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $requestsPendingReview = ($mrStatusCounts['pending_review'] ?? 0)
                               + ($mrStatusCounts['returned_for_revision'] ?? 0);
        $requestsApproved      = $mrStatusCounts['approved'] ?? 0;

        // Pending replacement requests specifically (higher priority)
        $replacementRequestsPending = MaterialRequest::where('type', 'replacement')
            ->whereIn('status', ['pending_review', 'returned_for_revision'])
            ->count();

        $poStatusCounts = PurchaseOrder::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $posWaitingDelivery = ($poStatusCounts['waiting_delivery'] ?? 0)
                            + ($poStatusCounts['partially_delivered'] ?? 0);

        // Purchase orders with missing actual cost (need attention)
        $posMissingCost = PurchaseOrder::whereIn('status', ['waiting_delivery', 'partially_delivered', 'completed'])
            ->whereNull('actual_total_cost')
            ->whereHas('materialRequest', fn ($q) => $q->where('status', 'approved'))
            ->count();

        // ═══════════════════════════════════════════════════════
        // 5. GOODS RECEIPTS AWAITING CONFIRMATION
        // ═══════════════════════════════════════════════════════
        $receiptsPending = GoodsReceipt::where('status', 'pending_confirmation')->count();

        $recentReceiptsPending = GoodsReceipt::with(['purchaseOrder.supplier', 'receiver'])
            ->where('status', 'pending_confirmation')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($gr) => [
                'id'           => $gr->id,
                'gr_number'    => $gr->gr_number,
                'po_number'    => $gr->purchaseOrder?->po_number,
                'supplier'     => $gr->purchaseOrder?->supplier?->name,
                'received_by'  => $gr->receiver?->name,
                'received_date' => $gr->received_date,
                'is_replacement' => (bool) $gr->is_replacement,
            ]);

        // ═══════════════════════════════════════════════════════
        // 6. DELIVERY OPERATIONS
        // ═══════════════════════════════════════════════════════
        $deliveryStatusCounts = Delivery::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $deliveriesPending   = ($deliveryStatusCounts['pending']   ?? 0)
                             + ($deliveryStatusCounts['assigned']  ?? 0);
        $deliveriesInTransit = ($deliveryStatusCounts['in_transit'] ?? 0)
                             + ($deliveryStatusCounts['picked_up']  ?? 0);
        $deliveriesFailed    = $deliveryStatusCounts['failed'] ?? 0;

        // Drivers and their current load
        $driverWorkload = User::whereHas('role', fn ($q) => $q->where('slug', 'driver'))
            ->withCount(['deliveries as active_deliveries_count' => function ($q) {
                $q->whereIn('status', ['assigned', 'picked_up', 'in_transit']);
            }])
            ->orderByDesc('active_deliveries_count')
            ->limit(6)
            ->get()
            ->map(fn ($d) => [
                'id'    => $d->id,
                'name'  => $d->name,
                'active_deliveries_count' => $d->active_deliveries_count,
            ]);

        // ═══════════════════════════════════════════════════════
        // 7. INVENTORY ALERTS
        // ═══════════════════════════════════════════════════════
        $lowStockMaterials = Material::with('category')
            ->where('status', 'active')
            ->whereColumn('stock_quantity', '<=', 'reorder_level')
            ->orderByRaw('(reorder_level - stock_quantity) DESC')
            ->limit(6)
            ->get()
            ->map(fn ($m) => [
                'id'             => $m->id,
                'name'           => $m->name,
                'unit'           => $m->unit,
                'category'       => $m->category?->name,
                'stock_quantity' => (float) $m->stock_quantity,
                'reorder_level'  => (float) $m->reorder_level,
                'deficit'        => max(0, (float) $m->reorder_level - (float) $m->stock_quantity),
            ]);

        $lowStockCount = Material::where('status', 'active')
            ->whereColumn('stock_quantity', '<=', 'reorder_level')
            ->count();

        $outOfStockCount = Material::where('status', 'active')
            ->where('stock_quantity', '<=', 0)
            ->count();

        // ═══════════════════════════════════════════════════════
        // 8. FINANCIAL SUMMARY (Manager only)
        // ═══════════════════════════════════════════════════════
        $monthStart = now()->startOfMonth();
        $monthEnd   = now()->endOfMonth();

        $revenueThisMonth = (float) Payment::where('status', 'paid')
            ->whereBetween('paid_at', [$monthStart, $monthEnd])
            ->sum('amount');

        $expensesThisMonth = (float) Expense::whereBetween('expense_date', [$monthStart, $monthEnd])
            ->sum('amount');

        $netThisMonth = $revenueThisMonth - $expensesThisMonth;

        // Outstanding payments (partially paid)
        $outstandingBalance = 0.0;
        $partialOrders = Order::where('payment_status', 'partially_paid')
            ->whereNotIn('status', ['cancelled'])
            ->withSum(['payments as total_paid' => fn ($q) => $q->where('status', 'paid')], 'amount')
            ->get();

        foreach ($partialOrders as $o) {
            $paid = (float) ($o->total_paid ?? 0);
            $outstandingBalance += max(0, (float) $o->total - $paid);
        }

        // ═══════════════════════════════════════════════════════
        // 9. TEAM / WORKFORCE
        // ═══════════════════════════════════════════════════════
        $totalCustomers = User::whereHas('role', fn ($q) => $q->where('slug', 'customer'))->count();
        $totalDrivers   = User::whereHas('role', fn ($q) => $q->where('slug', 'driver'))->count();
        $totalManagers  = User::whereHas('role', fn ($q) => $q->where('slug', 'manager'))->count();

        // ═══════════════════════════════════════════════════════
        // 10. RECENT ACTIVITY FEED (merged timeline)
        // ═══════════════════════════════════════════════════════
        $activity = collect();

        // Recent orders
        Order::with('user')->orderBy('created_at', 'desc')->limit(4)->get()
            ->each(function ($o) use ($activity) {
                $activity->push([
                    'type'  => 'order',
                    'icon'  => 'shopping-bag',
                    'label' => "New order #{$o->order_number} from " . ($o->user?->name ?? 'Unknown'),
                    'time'  => $o->created_at->toIso8601String(),
                ]);
            });

        // Recent material requests
        MaterialRequest::with('requester')->orderBy('created_at', 'desc')->limit(4)->get()
            ->each(function ($r) use ($activity) {
                $activity->push([
                    'type'  => 'material_request',
                    'icon'  => 'clipboard',
                    'label' => "Material request {$r->request_no} submitted by " . ($r->requester?->name ?? 'Unknown'),
                    'time'  => $r->created_at->toIso8601String(),
                ]);
            });

        // Recent goods receipts
        GoodsReceipt::with('purchaseOrder')->orderBy('created_at', 'desc')->limit(3)->get()
            ->each(function ($gr) use ($activity) {
                $activity->push([
                    'type'  => 'goods_receipt',
                    'icon'  => 'truck',
                    'label' => "Goods receipt {$gr->gr_number} created for PO " . ($gr->purchaseOrder?->po_number ?? '—'),
                    'time'  => $gr->created_at->toIso8601String(),
                ]);
            });

        // Recent payments
        Payment::with('order')->where('status', 'paid')->orderBy('paid_at', 'desc')->limit(3)->get()
            ->each(function ($p) use ($activity) {
                $activity->push([
                    'type'  => 'payment',
                    'icon'  => 'currency',
                    'label' => "Payment received for order #" . ($p->order?->order_number ?? '—'),
                    'time'  => ($p->paid_at ?? $p->created_at)->toIso8601String(),
                ]);
            });

        $recentActivity = $activity
            ->sortByDesc('time')
            ->take(8)
            ->values()
            ->all();

        // ═══════════════════════════════════════════════════════
        // RETURN
        // ═══════════════════════════════════════════════════════
        return Inertia::render('Manager/Dashboard', [
            'today' => [
                'orders'   => $ordersToday,
                'revenue'  => $revenueToday,
                'expenses' => $expensesToday,
                'net'      => $revenueToday - $expensesToday,
            ],
            'orders' => [
                'total'      => $ordersTotal,
                'pending'    => $ordersPending,
                'processing' => $ordersProcessing,
                'shipped'    => $ordersShipped,
                'delivered'  => $ordersDelivered,
                'byStatus'   => $orderStatusCounts,
            ],
            'production' => [
                'pipeline' => $productionPipeline,
                'stale'    => $staleOrders,
            ],
            'procurement' => [
                'requestsPendingReview'      => $requestsPendingReview,
                'replacementRequestsPending' => $replacementRequestsPending,
                'requestsApproved'           => $requestsApproved,
                'posWaitingDelivery'         => $posWaitingDelivery,
                'posMissingCost'             => $posMissingCost,
                'mrByStatus'                 => $mrStatusCounts,
                'poByStatus'                 => $poStatusCounts,
            ],
            'receipts' => [
                'pendingCount' => $receiptsPending,
                'pendingList'  => $recentReceiptsPending,
            ],
            'deliveries' => [
                'pending'   => $deliveriesPending,
                'inTransit' => $deliveriesInTransit,
                'failed'    => $deliveriesFailed,
                'byStatus'  => $deliveryStatusCounts,
                'driverWorkload' => $driverWorkload,
            ],
            'inventory' => [
                'lowStockCount'    => $lowStockCount,
                'outOfStockCount'  => $outOfStockCount,
                'lowStockMaterials' => $lowStockMaterials,
            ],
            'finance' => [
                'revenueThisMonth'   => $revenueThisMonth,
                'expensesThisMonth'  => $expensesThisMonth,
                'netThisMonth'       => $netThisMonth,
                'outstandingBalance' => $outstandingBalance,
            ],
            'team' => [
                'customers' => $totalCustomers,
                'drivers'   => $totalDrivers,
                'managers'  => $totalManagers,
            ],
            'recentActivity' => $recentActivity,
        ]);
    }
}
