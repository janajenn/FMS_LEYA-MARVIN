<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Material;
use App\Models\MaterialRequest;
use App\Models\Order;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // ─── ORDER COUNTS BY STATUS ───
        $orderStatusCounts = Order::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $totalOrders      = array_sum($orderStatusCounts);
        $pendingOrders    = ($orderStatusCounts['pending']  ?? 0)
                          + ($orderStatusCounts['accepted'] ?? 0);
        $processingOrders = $orderStatusCounts['processing'] ?? 0;
        $shippedOrders    = $orderStatusCounts['shipped']    ?? 0;
        $deliveredOrders  = $orderStatusCounts['delivered']  ?? 0;
        $cancelledOrders  = $orderStatusCounts['cancelled']  ?? 0;

        // ─── PRODUCTS ───
        $totalProducts  = Product::count();
        $activeProducts = Product::where('status', 'active')->count();

        // ─── MATERIALS + LOW STOCK ───
        $totalMaterials  = Material::count();
        $activeMaterials = Material::where('status', 'active')->count();

        $lowStockMaterials = Material::with('category')
            ->where('status', 'active')
            ->whereColumn('stock_quantity', '<=', 'reorder_level')
            ->orderByRaw('(reorder_level - stock_quantity) DESC')
            ->limit(8)
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

        // ─── DELIVERIES ───
        $deliveryStatusCounts = Delivery::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $pendingDeliveries  = ($deliveryStatusCounts['pending']   ?? 0)
                            + ($deliveryStatusCounts['assigned']  ?? 0);
        $inTransitDeliveries = ($deliveryStatusCounts['in_transit'] ?? 0)
                             + ($deliveryStatusCounts['picked_up']  ?? 0);

        // ─── PROCUREMENT ───
        $poStatusCounts = PurchaseOrder::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $mrStatusCounts = MaterialRequest::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $pendingPurchaseOrders = ($poStatusCounts['pending']          ?? 0)
                               + ($poStatusCounts['pending_approval'] ?? 0)
                               + ($poStatusCounts['draft']            ?? 0);

        $pendingMaterialRequests = ($mrStatusCounts['pending_review']     ?? 0)
                                 + ($mrStatusCounts['returned_for_revision'] ?? 0);

        // ─── PRODUCTION PIPELINE (orders currently in processing) ───
        $productionPipeline = Order::where('status', 'processing')
            ->select('production_stage', DB::raw('COUNT(*) as total'))
            ->groupBy('production_stage')
            ->pluck('total', 'production_stage')
            ->toArray();

        // ─── USERS ───
        $totalCustomers = User::whereHas('role', fn ($q) => $q->where('slug', 'customer'))->count();
        $totalDrivers   = User::whereHas('role', fn ($q) => $q->where('slug', 'driver'))->count();
        $totalSuppliers = Supplier::count();

        // ─── RECENT ORDERS ───
        $recentOrders = Order::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(6)
            ->get()
            ->map(fn ($o) => [
                'id'           => $o->id,
                'order_number' => $o->order_number,
                'customer'     => $o->user?->name ?? 'Unknown',
                'status'       => $o->status,
                'items_count'  => $o->items()->count(),
                'created_at'   => $o->created_at->toIso8601String(),
            ]);

        // ─── RECENT MATERIAL REQUESTS (pending review queue) ───
        $recentMaterialRequests = MaterialRequest::with('requester')
            ->whereIn('status', ['pending_review', 'returned_for_revision'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'id'           => $r->id,
                'request_no'   => $r->request_no,
                'requester'    => $r->requester?->name ?? 'Unknown',
                'type'         => $r->type,
                'status'       => $r->status,
                'created_at'   => $r->created_at->toIso8601String(),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalOrders'         => $totalOrders,
                'pendingOrders'       => $pendingOrders,
                'processingOrders'    => $processingOrders,
                'shippedOrders'       => $shippedOrders,
                'deliveredOrders'     => $deliveredOrders,
                'cancelledOrders'     => $cancelledOrders,
                'totalProducts'       => $totalProducts,
                'activeProducts'      => $activeProducts,
                'totalMaterials'      => $totalMaterials,
                'activeMaterials'     => $activeMaterials,
                'lowStockCount'       => $lowStockCount,
                'outOfStockCount'     => $outOfStockCount,
                'pendingDeliveries'   => $pendingDeliveries,
                'inTransitDeliveries' => $inTransitDeliveries,
                'pendingPurchaseOrders'   => $pendingPurchaseOrders,
                'pendingMaterialRequests' => $pendingMaterialRequests,
                'totalCustomers'      => $totalCustomers,
                'totalDrivers'        => $totalDrivers,
                'totalSuppliers'      => $totalSuppliers,
            ],
            'orderStatusCounts'    => $orderStatusCounts,
            'deliveryStatusCounts' => $deliveryStatusCounts,
            'poStatusCounts'       => $poStatusCounts,
            'mrStatusCounts'       => $mrStatusCounts,
            'productionPipeline'   => $productionPipeline,
            'lowStockMaterials'    => $lowStockMaterials,
            'recentOrders'         => $recentOrders,
            'recentMaterialRequests' => $recentMaterialRequests,
        ]);
    }
}
