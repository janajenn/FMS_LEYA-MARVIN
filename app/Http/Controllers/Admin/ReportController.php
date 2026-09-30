<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Material;
use App\Models\StockHistory;
use App\Models\AttendanceLog;
use App\Models\Payroll;
use App\Models\MaterialRequest;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\GoodsReceiptItem;
use Illuminate\Support\Facades\DB;
use App\Models\Delivery;


use App\Models\User;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
   

    public function dashboard(Request $request)
    {
        return Inertia::render(
            'Admin/Reports/Dashboard',
            $this->buildPrintableReportData($request)
        );
    }

    public function printable(Request $request)
    {
        return Inertia::render(
            'Admin/Reports/Printable',
            $this->buildPrintableReportData($request)
        );
    }

    /**
     * Single source of truth for the printable Operations Report.
     */
    private function buildPrintableReportData(Request $request): array
    {
        // ─── DATE RANGE (default: last 30 days) ───────────────
        $startInput = $request->get('start_date', now()->subDays(29)->toDateString());
        $endInput   = $request->get('end_date',   now()->toDateString());

        $start = Carbon::parse($startInput)->startOfDay();
        $end   = Carbon::parse($endInput)->endOfDay();

        // ─── ORDER STATUS COUNTS ──────────────────────────────
        $orderStatusCounts = Order::whereBetween('created_at', [$start, $end])
            ->select('status')->get()
            ->groupBy('status')->map->count()->toArray();
        $totalOrders = array_sum($orderStatusCounts);

        // ─── PRODUCTION PIPELINE ──────────────────────────────
        $productionPipeline = Order::where('status', 'processing')
            ->whereBetween('created_at', [$start, $end])
            ->select('production_stage')->get()
            ->groupBy('production_stage')->map->count()->toArray();

        // ─── DELIVERY STATUS ──────────────────────────────────
        $deliveryStatusCounts = Delivery::whereBetween('created_at', [$start, $end])
            ->select('status')->get()
            ->groupBy('status')->map->count()->toArray();
        $totalDeliveries = array_sum($deliveryStatusCounts);

        // ─── PROCUREMENT ──────────────────────────────────────
        $mrStatusCounts = MaterialRequest::whereBetween('created_at', [$start, $end])
            ->select('status')->get()
            ->groupBy('status')->map->count()->toArray();

        $poStatusCounts = PurchaseOrder::whereBetween('created_at', [$start, $end])
            ->select('status')->get()
            ->groupBy('status')->map->count()->toArray();

        // ─── PENDING ACTIONS (things needing admin attention) ─
        $pendingActions = [
            'material_requests' => MaterialRequest::whereIn('status', ['pending_review', 'returned_for_revision'])->count(),
            'purchase_orders'   => PurchaseOrder::whereIn('status', ['pending', 'pending_approval', 'draft'])->count(),
            'orders_accepted'   => Order::where('status', 'accepted')->count(),
            'unassigned_deliveries' => Delivery::whereNull('driver_id')
                ->whereNotIn('status', ['delivered', 'failed'])->count(),
            'low_stock'         => Material::where('status', 'active')
                ->whereColumn('stock_quantity', '<=', 'reorder_level')->count(),
        ];

        // ─── INVENTORY ────────────────────────────────────────
        $materials = Material::with('category')
            ->where('status', 'active')->orderBy('name')->get()
            ->map(function ($m) {
                $stock   = (float) $m->stock_quantity;
                $reorder = (float) $m->reorder_level;
                $state   = $stock <= 0 ? 'out' : ($stock <= $reorder ? 'low' : 'ok');
                return [
                    'id'             => $m->id,
                    'name'           => $m->name,
                    'unit'           => $m->unit,
                    'category'       => $m->category?->name ?? 'Uncategorized',
                    'stock_quantity' => $stock,
                    'reorder_level'  => $reorder,
                    'state'          => $state,
                ];
            })->values();

        $lowStockMaterials = $materials->where('state', 'low')->values();
        $outOfStockItems   = $materials->where('state', 'out')->values();
        $lowStockCount     = $lowStockMaterials->count();
        $outOfStockCount   = $outOfStockItems->count();
        $totalMaterials    = $materials->count();

        $materialsByCategory = $materials->groupBy('category')->map(fn ($g) => [
            'category' => $g->first()['category'],
            'count'    => $g->count(),
            'low'      => $g->where('state', 'low')->count(),
            'out'      => $g->where('state', 'out')->count(),
        ])->sortBy('category')->values();

        // ─── STOCK MOVEMENTS ──────────────────────────────────
        $stockMovements = StockHistory::with(['material', 'creator'])
            ->whereBetween('created_at', [$start, $end])
            ->orderByDesc('created_at')->limit(60)->get()
            ->map(fn ($s) => [
                'id'              => $s->id,
                'material'        => $s->material?->name ?? 'Unknown',
                'unit'            => $s->material?->unit,
                'quantity_change' => (float) $s->quantity_change,
                'reference_type'  => $s->reference_type,
                'created_by'      => $s->creator?->name ?? 'System',
                'created_at'      => $s->created_at->toIso8601String(),
            ]);

        // ─── ATTENDANCE ───────────────────────────────────────
        $attendanceLogs = AttendanceLog::with('user')
            ->whereHas('user', fn ($q) => $q->where('is_employee', true))
            ->whereBetween('created_at', [$start, $end])->get();

        $attendanceByEmployee = $attendanceLogs->groupBy('user_id')->map(function ($logs) {
            $user = $logs->first()->user;
            return [
                'name'       => $user?->name ?? 'Unknown',
                'email'      => $user?->email,
                'logs_count' => $logs->count(),
                'first_log'  => $logs->min('created_at'),
                'last_log'   => $logs->max('created_at'),
            ];
        })->sortByDesc('logs_count')->values();

        $totalAttendanceLogs = $attendanceLogs->count();
        $attendanceEmployees = $attendanceByEmployee->count();

        // ─── RECENT ORDERS ────────────────────────────────────
        $recentOrders = Order::with('user')
            ->whereBetween('created_at', [$start, $end])
            ->orderByDesc('created_at')->limit(30)->get()
            ->map(fn ($o) => [
                'id'               => $o->id,
                'order_number'     => $o->order_number,
                'customer'         => $o->user?->name ?? 'Guest',
                'status'           => $o->status,
                'production_stage' => $o->production_stage,
                'items_count'      => $o->items()->count(),
                'created_at'       => $o->created_at->toIso8601String(),
            ]);

        // ─── RECENT DELIVERIES ────────────────────────────────
        $recentDeliveries = Delivery::with(['order', 'driver', 'zone'])
            ->whereBetween('created_at', [$start, $end])
            ->orderByDesc('created_at')->limit(30)->get()
            ->map(fn ($d) => [
                'id'           => $d->id,
                'order_number' => $d->order?->order_number ?? 'N/A',
                'driver'       => $d->driver?->name ?? 'Unassigned',
                'zone'         => $d->zone?->name ?? 'N/A',
                'status'       => $d->status,
                'created_at'   => $d->created_at->toIso8601String(),
            ]);

        // ─── PEOPLE / RESOURCE SUMMARY ────────────────────────
        $userSummary = [
            'customers'       => User::whereHas('role', fn ($q) => $q->where('slug', 'customer'))->count(),
            'drivers'         => User::whereHas('role', fn ($q) => $q->where('slug', 'driver'))->count(),
            'employees'       => User::where('is_employee', true)->count(),
            'suppliers'       => Supplier::count(),
            'total_products'  => Product::count(),
            'active_products' => Product::where('status', 'active')->count(),
        ];

        // ─── NEW: PRODUCT CATALOG BY CATEGORY ─────────────────
        $productsByCategory = Product::select('category_id', DB::raw('COUNT(*) as total'))
            ->whereHas('category')
            ->groupBy('category_id')
            ->with('category:id,name')
            ->get()
            ->map(function ($row) {
                $active = Product::where('category_id', $row->category_id)
                    ->where('status', 'active')->count();
                return [
                    'category' => $row->category?->name ?? 'Uncategorized',
                    'total'    => (int) $row->total,
                    'active'   => $active,
                    'inactive' => (int) $row->total - $active,
                ];
            })->sortBy('category')->values();

        // ─── NEW: TOP ORDERED PRODUCTS (by quantity) ──────────
        $topProducts = OrderItem::select('product_id',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('COUNT(DISTINCT order_id) as orders_count'))
            ->whereHas('order', fn ($q) => $q
                ->whereBetween('created_at', [$start, $end])
                ->whereNotIn('status', ['cancelled']))
            ->groupBy('product_id')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->with('product:id,name')
            ->get()
            ->map(fn ($row) => [
                'product_name'   => $row->product?->name ?? 'Unknown',
                'total_quantity' => (int) $row->total_quantity,
                'orders_count'   => (int) $row->orders_count,
            ]);

        // ─── NEW: DELIVERY ZONE ACTIVITY ──────────────────────
        $deliveryZoneActivity = Delivery::select('delivery_zone_id',
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered"),
                DB::raw("SUM(CASE WHEN status = 'failed'    THEN 1 ELSE 0 END) as failed"))
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('delivery_zone_id')
            ->with('zone:id,name')
            ->get()
            ->map(fn ($row) => [
                'zone'      => $row->zone?->name ?? 'Unassigned',
                'total'     => (int) $row->total,
                'delivered' => (int) $row->delivered,
                'failed'    => (int) $row->failed,
            ])->sortByDesc('total')->values();

        // ─── NEW: DRIVER WORKLOAD ─────────────────────────────
        $driverWorkload = Delivery::select('driver_id',
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed"),
                DB::raw("SUM(CASE WHEN status = 'failed'    THEN 1 ELSE 0 END) as failed"),
                DB::raw("SUM(CASE WHEN status IN ('pending','assigned','picked_up','in_transit') THEN 1 ELSE 0 END) as in_progress"))
            ->whereBetween('created_at', [$start, $end])
            ->whereNotNull('driver_id')
            ->groupBy('driver_id')
            ->with('driver:id,name')
            ->get()
            ->map(fn ($row) => [
                'driver'      => $row->driver?->name ?? 'Unknown',
                'total'       => (int) $row->total,
                'completed'   => (int) $row->completed,
                'in_progress' => (int) $row->in_progress,
                'failed'      => (int) $row->failed,
                'rate'        => $row->total > 0
                    ? round(($row->completed / $row->total) * 100, 1) : 0,
            ])->sortByDesc('total')->values();

        // ─── NEW: SUPPLIER ACTIVITY (PO count) ────────────────
        $supplierActivity = PurchaseOrder::select('supplier_id', DB::raw('COUNT(*) as po_count'))
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('supplier_id')
            ->with('supplier:id,name')
            ->get()
            ->map(fn ($row) => [
                'supplier' => $row->supplier?->name ?? 'Unknown',
                'po_count' => (int) $row->po_count,
            ])->sortByDesc('po_count')->values();

        // ─── NEW: DAMAGE & REPLACEMENT TRACKING ───────────────
        $damagedSummary = GoodsReceiptItem::where('damaged_quantity', '>', 0)
            ->whereHas('goodsReceipt', fn ($q) =>
                $q->whereBetween('received_date', [$start, $end]))
            ->with('purchaseOrderItem.material:id,name,unit')
            ->get()
            ->groupBy(fn ($item) =>
                $item->purchaseOrderItem?->material?->name ?? 'Unknown')
            ->map(fn ($items, $name) => [
                'material'         => $name,
                'unit'             => $items->first()->purchaseOrderItem?->material?->unit,
                'damaged_quantity' => (float) $items->sum('damaged_quantity'),
                'incidents'        => $items->count(),
            ])->values()->sortByDesc('damaged_quantity')->values();

        $totalDamagedItems = $damagedSummary->sum('damaged_quantity');
        $totalDamageIncidents = $damagedSummary->sum('incidents');

        return [
            'dateRange' => [
                'start' => $start->toDateString(),
                'end'   => $end->toDateString(),
            ],
            'generatedAt'          => now()->toIso8601String(),
            'orderStatusCounts'    => $orderStatusCounts,
            'totalOrders'          => $totalOrders,
            'productionPipeline'   => $productionPipeline,
            'deliveryStatusCounts' => $deliveryStatusCounts,
            'totalDeliveries'      => $totalDeliveries,
            'mrStatusCounts'       => $mrStatusCounts,
            'poStatusCounts'       => $poStatusCounts,
            'pendingActions'       => $pendingActions,
            'materials'            => $materials,
            'materialsByCategory'  => $materialsByCategory,
            'lowStockMaterials'    => $lowStockMaterials,
            'outOfStockItems'      => $outOfStockItems,
            'totalMaterials'       => $totalMaterials,
            'lowStockCount'        => $lowStockCount,
            'outOfStockCount'      => $outOfStockCount,
            'stockMovements'       => $stockMovements,
            'attendanceByEmployee' => $attendanceByEmployee,
            'totalAttendanceLogs'  => $totalAttendanceLogs,
            'attendanceEmployees'  => $attendanceEmployees,
            'recentOrders'         => $recentOrders,
            'recentDeliveries'     => $recentDeliveries,
            'userSummary'          => $userSummary,
            // NEW
            'productsByCategory'   => $productsByCategory,
            'topProducts'          => $topProducts,
            'deliveryZoneActivity' => $deliveryZoneActivity,
            'driverWorkload'       => $driverWorkload,
            'supplierActivity'     => $supplierActivity,
            'damagedSummary'       => $damagedSummary,
            'totalDamagedItems'    => $totalDamagedItems,
            'totalDamageIncidents' => $totalDamageIncidents,
        ];
    }

    // Sales Report
    public function sales(Request $request)
    {
        $filters = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'product_id' => 'nullable|exists:products,id',
            'category_id' => 'nullable|exists:product_categories,id',
        ]);

        $query = Order::with(['items.product.category'])
            ->where('status', 'delivered');

        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        $products = Product::with('category')->get();
        $categories = ProductCategory::all();

        return Inertia::render('Admin/Reports/Sales', [
            'orders' => $orders,
            'filters' => $filters,
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    // Inventory Report
    public function inventory(Request $request)
    {
        $materials = Material::with('category')->orderBy('stock_quantity')->get();
        $products = Product::with('category')->where('stock_quantity', '>', 0)->get();

        return Inertia::render('Admin/Reports/Inventory', [
            'materials' => $materials,
            'products' => $products,
        ]);
    }

    // Stock Movement
    public function stockMovement(Request $request)
    {
        $filters = $request->validate([
            'material_id' => 'nullable|exists:materials,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $query = StockHistory::with(['material', 'creator']);

        if (!empty($filters['material_id'])) {
            $query->where('material_id', $filters['material_id']);
        }
        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        $history = $query->orderBy('created_at', 'desc')->get();

        $materials = Material::all();

        return Inertia::render('Admin/Reports/StockMovement', [
            'history' => $history,
            'filters' => $filters,
            'materials' => $materials,
        ]);
    }

    // Attendance Report
    public function attendance(Request $request)
    {
        $filters = $request->validate([
            'employee_id' => 'nullable|exists:users,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $query = AttendanceLog::with('user')
            ->whereHas('user', fn($q) => $q->where('is_employee', true));

        if (!empty($filters['employee_id'])) {
            $query->where('user_id', $filters['employee_id']);
        }
        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        $employees = User::where('is_employee', true)->get();

        return Inertia::render('Admin/Reports/Attendance', [
            'logs' => $logs,
            'filters' => $filters,
            'employees' => $employees,
        ]);
    }

    // Payroll Report
    public function payroll(Request $request)
    {
        $payrolls = Payroll::with('user')->orderBy('created_at', 'desc')->get();

        $summary = [
            'total_gross' => $payrolls->sum('gross_salary'),
            'total_net' => $payrolls->sum('net_salary'),
            'total_deductions' => $payrolls->sum('deductions'),
            'total_overtime' => $payrolls->sum('overtime_pay'),
        ];

        return Inertia::render('Admin/Reports/Payroll', [
            'payrolls' => $payrolls,
            'summary' => $summary,
        ]);
    }

    // Capital vs Sales
    public function capitalVsSales(Request $request)
    {
        // Capital = total cost of materials used (sum of material costs from stock-in)
        // For simplicity, we'll use stock-in total cost as capital
        $totalCapital = StockHistory::where('reference_type', 'stock_in')->sum('quantity_change')
            ? Material::sum('cost') // approximate
            : 0; // More accurate: sum from StockIn table, but we don't have a direct cost column.

        // For a better calculation, we should have total cost from stock_in.
        // For now, we'll sum material cost * stock_quantity (approximate)
        $totalCapital = Material::sum(\DB::raw('cost * stock_quantity'));

        // Sales = total revenue from delivered orders
        $totalSales = Order::where('status', 'delivered')->sum('total');

        // Profit = sales - capital
        $profit = $totalSales - $totalCapital;

        return Inertia::render('Admin/Reports/CapitalVsSales', [
            'capital' => $totalCapital,
            'sales' => $totalSales,
            'profit' => $profit,
        ]);
    }

    // Delivery Report
    public function delivery(Request $request)
    {
        $deliveries = Delivery::with(['order', 'driver', 'zone'])->orderBy('created_at', 'desc')->get();

        $statusCounts = [
            'pending' => $deliveries->where('status', 'pending')->count(),
            'assigned' => $deliveries->where('status', 'assigned')->count(),
            'picked_up' => $deliveries->where('status', 'picked_up')->count(),
            'in_transit' => $deliveries->where('status', 'in_transit')->count(),
            'delivered' => $deliveries->where('status', 'delivered')->count(),
            'failed' => $deliveries->where('status', 'failed')->count(),
        ];

        return Inertia::render('Admin/Reports/Delivery', [
            'deliveries' => $deliveries,
            'statusCounts' => $statusCounts,
        ]);
    }

    // Export to PDF (optional)
    public function exportPdf(Request $request)
    {
        // This will be implemented per report if needed.
    }


        /**
     * Printable Operations Report — no financial data.
     * Focuses on orders, production, delivery, procurement, inventory,
     * stock movements, attendance and people/resource counts.
     */
    
}
