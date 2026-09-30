<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class FinanceController extends Controller
{
    private const VALID_PERIODS = ['week', 'month', 'year', 'all'];

    public function index(Request $request)
    {
        $period = $request->get('period', 'month');
        if (!in_array($period, self::VALID_PERIODS, true)) {
            $period = 'month';
        }

        [$start, $end] = $this->getDateRange($period);

        // ─── CURRENT BALANCE (always all-time) ───
        $allTimeReceived = (float) Payment::where('status', 'paid')->sum('amount');
        $allTimeExpenses = (float) Expense::sum('amount');
        $currentBalance  = $allTimeReceived - $allTimeExpenses;

        // ─── BASE QUERIES (period-filtered) ───
        $ordersBase   = Order::query();
        $paymentsBase = Payment::where('status', 'paid');
        $expensesBase = Expense::query();

        if ($start && $end) {
            $ordersBase->whereBetween('created_at',    [$start, $end]);
            $paymentsBase->whereBetween('paid_at',     [$start, $end]);
            $expensesBase->whereBetween('expense_date',[$start, $end]);
        }

        // ─── 1. SALES ───
        $totalSales  = (float) (clone $ordersBase)->where('status', 'completed')->sum('total');
        $bookedSales = (float) (clone $ordersBase)->whereNotIn('status', ['cancelled'])->sum('total');

        // ─── 2. PAYMENTS RECEIVED ───
        $totalReceived = (float) (clone $paymentsBase)->sum('amount');

        $gcashPayments = (float) (clone $paymentsBase)
            ->whereIn('method', ['gcash', 'paymongo'])
            ->sum('amount');

        $cashPayments = (float) (clone $paymentsBase)
            ->whereIn('method', ['cash', 'cash_on_delivery'])
            ->sum('amount');

        // ─── 3. OUTSTANDING BALANCES ───
        $remainingPayments = 0.0;

        $partialQuery = Order::where('payment_status', 'partially_paid')
            ->whereNotIn('status', ['cancelled'])
            ->withSum(['payments as total_paid' => function ($q) {
                $q->where('status', 'paid');
            }], 'amount');

        if ($start && $end) {
            $partialQuery->whereBetween('created_at', [$start, $end]);
        }

        foreach ($partialQuery->get() as $order) {
            $paid = (float) ($order->total_paid ?? 0);
            $remainingPayments += max(0, (float) $order->total - $paid);
        }

        // ─── 4. EXPENSES ───
        $totalExpenses = (float) (clone $expensesBase)->sum('amount');

        $expensesByCategory = (clone $expensesBase)
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'category' => $row->category,
                'total'    => (float) $row->total,
            ]);

        // ─── 5. LABOR COST (completed production only) ───
        $laborQuery = OrderItem::whereNotNull('labor_cost')
            ->where('labor_status', 'completed')
            ->whereHas('order', fn ($q) => $q->whereNotIn('status', ['cancelled']));

        if ($start && $end) {
            $laborQuery->whereBetween('labor_completed_at', [$start, $end]);
        }

        $totalLaborCost = (float) $laborQuery->sum('labor_cost');
        $laborItemCount = (int) $laborQuery->count();

        // ─── 6. LABOR BY PRODUCT (for variance) ───
        $laborByProduct = OrderItem::whereNotNull('labor_cost')
            ->where('labor_status', 'completed')
            ->when($start && $end, fn ($q) =>
                $q->whereBetween('labor_completed_at', [$start, $end])
            )
            ->with('product:id,name,labor_cost')
            ->get()
            ->groupBy('product_id')
            ->map(function ($items) {
                $product = $items->first()->product;
                $estimated = (float) ($product->labor_cost ?? 0);
                $actualAvg = (float) $items->avg('labor_cost');

                return [
                    'product_id'      => $product?->id,
                    'product_name'    => $product?->name ?? 'Unknown',
                    'orders_count'    => $items->count(),
                    'estimated_labor' => $estimated,
                    'actual_avg'      => round($actualAvg, 2),
                    'variance'        => round($actualAvg - $estimated, 2),
                ];
            })
            ->values();

        // ─── 7. NET PROFIT ───
        $netProfit = $totalSales - $totalExpenses - $totalLaborCost;

        // ─── 8. TREND ───
        $trend = $this->getTrend($period);

        // ─── 9. RECENT EXPENSES ───
        $recentQuery = Expense::with('recorder')->orderByDesc('expense_date');
        if ($start && $end) {
            $recentQuery->whereBetween('expense_date', [$start, $end]);
        }
        $recentExpenses = $recentQuery->limit(10)->get();

        return Inertia::render('Manager/Finance/Index', [
            'period' => $period,
            'summary' => [
                'currentBalance'    => $currentBalance,
                'totalSales'        => $totalSales,
                'bookedSales'       => $bookedSales,
                'totalReceived'     => $totalReceived,
                'gcashPayments'     => $gcashPayments,
                'cashPayments'      => $cashPayments,
                'remainingPayments' => $remainingPayments,
                'totalExpenses'     => $totalExpenses,
                'totalLaborCost'    => $totalLaborCost,
                'laborItemCount'    => $laborItemCount,
                'netProfit'         => $netProfit,
            ],
            'expensesByCategory' => $expensesByCategory,
            'laborByProduct'     => $laborByProduct,
            'monthlyTrend'       => $trend,
            'recentExpenses'     => $recentExpenses,
        ]);
    }

    private function getDateRange(string $period): array
    {
        return match ($period) {
            'week'  => [now()->startOfWeek(),  now()->endOfWeek()],
            'month' => [now()->startOfMonth(), now()->endOfMonth()],
            'year'  => [now()->startOfYear(),  now()->endOfYear()],
            'all'   => [null, null],
            default => [now()->startOfMonth(), now()->endOfMonth()],
        };
    }

    private function getTrend(string $period): array
    {
        $buckets = [];

        switch ($period) {
            case 'week':
                $start = now()->startOfWeek();
                for ($i = 0; $i < 7; $i++) {
                    $d = $start->copy()->addDays($i);
                    $buckets[] = [
                        'label' => $d->format('D'),
                        'start' => $d->copy()->startOfDay(),
                        'end'   => $d->copy()->endOfDay(),
                    ];
                }
                break;

            case 'month':
                $monthStart = now()->startOfMonth();
                $monthEnd   = now()->endOfMonth();
                $cursor     = $monthStart->copy();
                $weekNum    = 1;
                while ($cursor->lte($monthEnd)) {
                    $weekEnd = $cursor->copy()->addDays(6);
                    if ($weekEnd->gt($monthEnd)) $weekEnd = $monthEnd->copy();
                    $buckets[] = [
                        'label' => "Wk {$weekNum}",
                        'start' => $cursor->copy()->startOfDay(),
                        'end'   => $weekEnd->copy()->endOfDay(),
                    ];
                    $cursor = $weekEnd->copy()->addDay()->startOfDay();
                    $weekNum++;
                }
                break;

            case 'year':
                $year = now()->year;
                for ($m = 1; $m <= 12; $m++) {
                    $d = Carbon::create($year, $m, 1);
                    $buckets[] = [
                        'label' => $d->format('M'),
                        'start' => $d->copy()->startOfMonth(),
                        'end'   => $d->copy()->endOfMonth(),
                    ];
                }
                break;

            case 'all':
            default:
                for ($i = 5; $i >= 0; $i--) {
                    $d = now()->subMonths($i);
                    $buckets[] = [
                        'label' => $d->format('M Y'),
                        'start' => $d->copy()->startOfMonth(),
                        'end'   => $d->copy()->endOfMonth(),
                    ];
                }
                break;
        }

        $trend = [];
        foreach ($buckets as $b) {
            $income = (float) Payment::where('status', 'paid')
                ->whereBetween('paid_at', [$b['start'], $b['end']])
                ->sum('amount');

            $expense = (float) Expense::whereBetween('expense_date', [$b['start'], $b['end']])
                ->sum('amount');

            $labor = (float) OrderItem::whereNotNull('labor_cost')
                ->where('labor_status', 'completed')
                ->whereBetween('labor_completed_at', [$b['start'], $b['end']])
                ->sum('labor_cost');

            $trend[] = [
                'label'   => $b['label'],
                'income'  => $income,
                'expense' => $expense,
                'labor'   => $labor,
                'net'     => $income - $expense - $labor,
            ];
        }

        return $trend;
    }


        /**
     * Printable financial report page.
     */
    public function report(Request $request)
    {
        $period = $request->get('period', 'month');
        if (!in_array($period, self::VALID_PERIODS, true)) {
            $period = 'month';
        }

        [$start, $end] = $this->getDateRange($period);

        return Inertia::render(
            'Manager/Finance/Report',
            $this->buildReportData($period, $start, $end)
        );
    }

    /**
     * Gather every dataset the printable report needs.
     */
    private function buildReportData(string $period, $start, $end): array
    {
        // Categories that we treat as "material / purchase" expenses
        // (everything else is treated as operating expense).
        $materialCategories = [
            'materials', 'raw_materials', 'material',
            'supplies', 'purchase', 'purchases', 'procurement',
        ];

        // ─── SALES ─────────────────────────────────────────────
        $ordersBase = Order::query();
        if ($start && $end) {
            $ordersBase->whereBetween('created_at', [$start, $end]);
        }

        $completedOrders = (clone $ordersBase)->where('status', 'completed')->get();
        $completedCount  = $completedOrders->count();
        $totalSales      = (float) $completedOrders->sum('total');
        $bookedSales     = (float) (clone $ordersBase)->whereNotIn('status', ['cancelled'])->sum('total');
        $avgOrderValue   = $completedCount > 0 ? round($totalSales / $completedCount, 2) : 0.0;

        // ─── PAYMENTS ──────────────────────────────────────────
        $paymentsBase = Payment::where('status', 'paid');
        if ($start && $end) {
            $paymentsBase->whereBetween('paid_at', [$start, $end]);
        }

        $payments      = (clone $paymentsBase)->orderByDesc('paid_at')->get();
        $totalReceived = (float) $payments->sum('amount');

        $byMethod = $payments->groupBy('method')->map(fn ($g) => [
            'method' => $g->first()->method,
            'count'  => $g->count(),
            'total'  => (float) $g->sum('amount'),
        ])->sortByDesc('total')->values();

        $byType = $payments->groupBy('type')->map(fn ($g) => [
            'type'  => $g->first()->type,
            'count' => $g->count(),
            'total' => (float) $g->sum('amount'),
        ])->sortByDesc('total')->values();

        // ─── OUTSTANDING BALANCES ──────────────────────────────
        $partialQuery = Order::query()
            ->where('payment_status', 'partially_paid')
            ->whereNotIn('status', ['cancelled'])
            ->with('user:id,name,email')
            ->withSum(['payments as total_paid' => function ($q) {
                $q->where('status', 'paid');
            }], 'amount');

        if ($start && $end) {
            $partialQuery->whereBetween('created_at', [$start, $end]);
        }

        $outstandingOrders = $partialQuery->get()
            ->map(function ($order) {
                $paid = (float) ($order->total_paid ?? 0);
                return [
                    'id'           => $order->id,
                    'order_number' => $order->order_number,
                    'customer'     => $order->user?->name ?? 'N/A',
                    'email'        => $order->user?->email,
                    'created_at'   => optional($order->created_at)->toIso8601String(),
                    'total'        => (float) $order->total,
                    'paid'         => $paid,
                    'remaining'    => max(0, (float) $order->total - $paid),
                ];
            })
            ->filter(fn ($o) => $o['remaining'] > 0)
            ->sortByDesc('remaining')
            ->values();

        $outstandingTotal = (float) $outstandingOrders->sum('remaining');

        // ─── EXPENSES ──────────────────────────────────────────
        $expensesBase = Expense::query();
        if ($start && $end) {
            $expensesBase->whereBetween('expense_date', [$start, $end]);
        }

        $expenses      = (clone $expensesBase)->orderByDesc('expense_date')->get();
        $totalExpenses = (float) $expenses->sum('amount');

        $expensesByCategory = $expenses->groupBy('category')->map(fn ($g) => [
            'category' => $g->first()->category,
            'count'    => $g->count(),
            'total'    => (float) $g->sum('amount'),
        ])->sortByDesc('total')->values();

        $materialExpenses = $expenses->filter(
            fn ($e) => in_array(strtolower((string) $e->category), $materialCategories, true)
        );
        $materialExpensesTotal = (float) $materialExpenses->sum('amount');
        $otherExpensesTotal    = $totalExpenses - $materialExpensesTotal;

        // ─── LABOR ─────────────────────────────────────────────
        $laborQuery = OrderItem::whereNotNull('labor_cost')
            ->where('labor_status', 'completed')
            ->whereHas('order', fn ($q) => $q->whereNotIn('status', ['cancelled']));

        if ($start && $end) {
            $laborQuery->whereBetween('labor_completed_at', [$start, $end]);
        }

        $laborItems     = $laborQuery->with('product:id,name,labor_cost')->get();
        $totalLaborCost = (float) $laborItems->sum('labor_cost');
        $laborItemCount = $laborItems->count();

        $laborByProduct = $laborItems->groupBy('product_id')->map(function ($items) {
            $product   = $items->first()->product;
            $estimated = (float) ($product->labor_cost ?? 0);
            $actualAvg = (float) $items->avg('labor_cost');
            return [
                'product_id'      => $product?->id,
                'product_name'    => $product?->name ?? 'Unknown',
                'orders_count'    => $items->count(),
                'estimated_labor' => $estimated,
                'actual_avg'      => round($actualAvg, 2),
                'actual_total'    => round((float) $items->sum('labor_cost'), 2),
                'variance'        => round($actualAvg - $estimated, 2),
            ];
        })->sortByDesc('actual_total')->values();

        // ─── PROFIT ────────────────────────────────────────────
        $grossProfit  = $totalSales - $materialExpensesTotal - $totalLaborCost;
        $netProfit    = $totalSales - $totalExpenses - $totalLaborCost;
        $profitMargin = $totalSales > 0 ? round(($netProfit / $totalSales) * 100, 2) : 0.0;

        return [
            'period'      => $period,
            'periodLabel' => $this->getPeriodLabel($period),
            'dateRange'   => [
                'start' => $start?->toDateString(),
                'end'   => $end?->toDateString(),
            ],
            'generatedAt' => now()->toIso8601String(),
            'sales' => [
                'totalSales'     => $totalSales,
                'bookedSales'    => $bookedSales,
                'completedCount' => $completedCount,
                'avgOrderValue'  => $avgOrderValue,
            ],
            'payments' => [
                'totalReceived' => $totalReceived,
                'count'         => $payments->count(),
                'byMethod'      => $byMethod,
                'byType'        => $byType,
            ],
            'outstanding' => [
                'total'  => $outstandingTotal,
                'count'  => $outstandingOrders->count(),
                'orders' => $outstandingOrders,
            ],
            'expenses' => [
                'total'          => $totalExpenses,
                'count'          => $expenses->count(),
                'byCategory'     => $expensesByCategory,
                'materialsTotal' => $materialExpensesTotal,
                'otherTotal'     => $otherExpensesTotal,
            ],
            'labor' => [
                'total'     => $totalLaborCost,
                'itemCount' => $laborItemCount,
                'byProduct' => $laborByProduct,
            ],
            'profit' => [
                'grossProfit'  => $grossProfit,
                'netProfit'    => $netProfit,
                'profitMargin' => $profitMargin,
            ],
        ];
    }

    private function getPeriodLabel(string $period): string
    {
        return match ($period) {
            'week'  => 'This Week',
            'month' => 'This Month',
            'year'  => 'This Year',
            'all'   => 'All Time',
            default => 'This Month',
        };
    }
}
