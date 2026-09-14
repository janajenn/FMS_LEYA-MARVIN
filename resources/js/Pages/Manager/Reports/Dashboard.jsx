import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head } from '@inertiajs/react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

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
            },
        ],
    };

    return (
        <ManagerLayout>
            <Head title="Reports Dashboard" />
            <div className="space-y-6">
                <div className="bg-white shadow-sm rounded-lg p-6">
                    <h1 className="text-2xl font-bold">Reports Dashboard</h1>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-gray-100 p-4 rounded">
                            <p className="text-sm text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold">{stats.totalOrders}</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded">
                            <p className="text-sm text-gray-600">Total Sales</p>
                            <p className="text-2xl font-bold">₱{stats.totalSales.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded">
                            <p className="text-sm text-gray-600">Pending Orders</p>
                            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded">
                            <p className="text-sm text-gray-600">Low Stock Products</p>
                            <p className="text-2xl font-bold">{stats.lowStockProducts}</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2">Sales Trend (Last 30 Days)</h3>
                        <div className="h-64">
                            <Bar data={salesChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    </div>
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2">Top Categories</h3>
                        <div className="h-64 flex items-center justify-center">
                            <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}
