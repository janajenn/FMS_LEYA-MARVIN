<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Material;
use App\Models\AttendanceLog;
use App\Models\Payroll;
use App\Models\Delivery;
use App\Models\OrderItem;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function dashboard()
    {
        // Summary stats
        $totalOrders = Order::count();
        $totalSales = Order::sum('total');
        $pendingOrders = Order::where('status', 'pending')->count();
        $lowStockProducts = Product::where('stock_quantity', '<', 10)->count();

        // Sales trend (last 30 days)
        $salesData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $salesData['labels'][] = $date->format('M d');
            $salesData['data'][] = Order::whereDate('created_at', $date)->sum('total');
        }

        // Category sales
        $categorySales = OrderItem::with('product.category')
            ->selectRaw('product_id, sum(quantity * price) as total')
            ->groupBy('product_id')
            ->get()
            ->groupBy('product.category.name')
            ->map(fn($items) => $items->sum('total'))
            ->sortDesc()
            ->take(5);

        return Inertia::render('Manager/Reports/Dashboard', [
            'stats' => [
                'totalOrders' => $totalOrders,
                'totalSales' => $totalSales,
                'pendingOrders' => $pendingOrders,
                'lowStockProducts' => $lowStockProducts,
            ],
            'salesTrend' => $salesData,
            'categorySales' => $categorySales,
        ]);
    }

    // Sales Report (with filters)
    public function sales(Request $request)
    {
        $filters = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
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

        return Inertia::render('Manager/Reports/Sales', [
            'orders' => $orders,
            'filters' => $filters,
        ]);
    }

    // Inventory Report
    public function inventory()
    {
        $materials = Material::with('category')->orderBy('stock_quantity')->get();
        $products = Product::with('category')->where('stock_quantity', '>', 0)->get();

        return Inertia::render('Manager/Reports/Inventory', [
            'materials' => $materials,
            'products' => $products,
        ]);
    }

    // Attendance Report
    public function attendance(Request $request)
    {
        $filters = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $query = AttendanceLog::with('user')
            ->whereHas('user', fn($q) => $q->where('is_employee', true));

        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Manager/Reports/Attendance', [
            'logs' => $logs,
            'filters' => $filters,
        ]);
    }

    // Payroll Report
    public function payroll()
    {
        $payrolls = Payroll::with('user')->orderBy('created_at', 'desc')->get();

        $summary = [
            'total_gross' => $payrolls->sum('gross_salary'),
            'total_net' => $payrolls->sum('net_salary'),
            'total_deductions' => $payrolls->sum('deductions'),
            'total_overtime' => $payrolls->sum('overtime_pay'),
        ];

        return Inertia::render('Manager/Reports/Payroll', [
            'payrolls' => $payrolls,
            'summary' => $summary,
        ]);
    }

    // Capital vs Sales
    public function capitalVsSales()
    {
        $totalCapital = Material::sum(\DB::raw('cost * stock_quantity'));
        $totalSales = Order::where('status', 'delivered')->sum('total');
        $profit = $totalSales - $totalCapital;

        return Inertia::render('Manager/Reports/CapitalVsSales', [
            'capital' => $totalCapital,
            'sales' => $totalSales,
            'profit' => $profit,
        ]);
    }

    // Delivery Report
    public function delivery()
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

        return Inertia::render('Manager/Reports/Delivery', [
            'deliveries' => $deliveries,
            'statusCounts' => $statusCounts,
        ]);
    }
}
