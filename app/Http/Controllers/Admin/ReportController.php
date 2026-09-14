<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Material;
use App\Models\StockHistory;
use App\Models\AttendanceLog;
use App\Models\Payroll;
use App\Models\Delivery;
use App\Models\User;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    // Dashboard with summary and charts
    public function dashboard(Request $request)
    {
        // Summary cards
        $totalOrders = Order::count();
        $totalSales = Order::sum('total');
        $pendingOrders = Order::where('status', 'pending')->count();
        $lowStockProducts = Product::where('stock_quantity', '<', 10)->count();
        $totalEmployees = User::where('is_employee', true)->count();
        $pendingDeliveries = Delivery::whereIn('status', ['pending', 'assigned', 'picked_up'])->count();

        // Sales trend (last 30 days)
        $salesData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $salesData['labels'][] = $date->format('M d');
            $salesData['data'][] = Order::whereDate('created_at', $date)->sum('total');
        }

        // Category sales (top 5 categories)
        $categorySales = OrderItem::with('product.category')
            ->selectRaw('product_id, sum(quantity * price) as total')
            ->groupBy('product_id')
            ->get()
            ->groupBy('product.category.name')
            ->map(fn($items) => $items->sum('total'))
            ->sortDesc()
            ->take(5);

        return Inertia::render('Admin/Reports/Dashboard', [
            'stats' => [
                'totalOrders' => $totalOrders,
                'totalSales' => $totalSales,
                'pendingOrders' => $pendingOrders,
                'lowStockProducts' => $lowStockProducts,
                'totalEmployees' => $totalEmployees,
                'pendingDeliveries' => $pendingDeliveries,
            ],
            'salesTrend' => $salesData,
            'categorySales' => $categorySales,
        ]);
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
}
