import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import {
    ShoppingBagIcon,
    CurrencyDollarIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    UsersIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard({ stats, salesTrend, categorySales }) {
    const salesChartData = {
        labels: salesTrend.labels,
        datasets: [
            {
                label: 'Sales (₱)',
                data: salesTrend.data,
                backgroundColor: 'rgba(111, 78, 55, 0.2)',
                borderColor: '#6F4E37',
                borderWidth: 2,
                borderRadius: 4,
            },
        ],
    };

    const categoryChartData = {
        labels: Object.keys(categorySales),
        datasets: [
            {
                label: 'Sales by Category',
                data: Object.values(categorySales),
                backgroundColor: ['#6F4E37', '#8B6B4F', '#A8896B', '#C4A88A', '#D4B8A0'],
                borderWidth: 0,
            },
        ],
    };

    const statCards = [
        { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBagIcon },
        { label: 'Total Sales', value: `₱${stats.totalSales.toFixed(2)}`, icon: CurrencyDollarIcon },
        { label: 'Pending Orders', value: stats.pendingOrders, icon: ClockIcon },
        { label: 'Low Stock Products', value: stats.lowStockProducts, icon: ExclamationTriangleIcon },
        { label: 'Employees', value: stats.totalEmployees, icon: UsersIcon },
        { label: 'Pending Deliveries', value: stats.pendingDeliveries, icon: TruckIcon },
    ];

    return (
        <AdminLayout>
            <Head title="Dashboard" />

            <div className="py-4">
                <div className="w-full">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                        {statCards.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={stat.label}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-4 hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
                                                {stat.label}
                                            </p>
                                            <p className="mt-1 text-xl font-bold text-gray-900">
                                                {stat.value}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 ml-2">
                                            <div className="h-10 w-10 rounded-lg bg-[#F5EDE8] flex items-center justify-center">
                                                <Icon className="h-5 w-5 text-[#6F4E37]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-4">
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Sales Trend (Last 30 Days)</h3>
                            <div className="h-64">
                                <Bar data={salesChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-4">
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Top Categories</h3>
                            <div className="h-64 flex items-center justify-center">
                                <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
