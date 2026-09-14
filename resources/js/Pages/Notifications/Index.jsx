import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { useState } from 'react';
import axios from 'axios';
import {
    InboxIcon,
    DocumentTextIcon,
    ClipboardDocumentListIcon,
    ArchiveBoxIcon,
    ArrowPathIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function Index({ notifications }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const Layout = user?.role?.slug === 'admin' ? AdminLayout : ManagerLayout;

    const [items, setItems] = useState(notifications.data);

    const markAsRead = async (id) => {
        try {
            await axios.post(`/notifications/${id}/read`);
            setItems(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.post('/notifications/mark-all-read');
            setItems(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const getIcon = (type) => {
        const icons = {
            material_request: DocumentTextIcon,
            purchase_order: ClipboardDocumentListIcon,
            goods_receipt: ArchiveBoxIcon,
            replacement_request: ArrowPathIcon,
        };
        return icons[type] || InboxIcon;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 172800000) return 'Yesterday';
        return date.toLocaleDateString();
    };

    return (
        <Layout>
            <Head title="Notifications" />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Notifications</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {notifications.total} notification{notifications.total !== 1 ? 's' : ''} in total
                                </p>
                            </div>
                            {notifications.total > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-[#6F4E37] hover:text-[#5A3E2B] hover:bg-[#F5EDE8] rounded-lg transition-colors"
                                >
                                    <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* Notifications list */}
                        {items.length === 0 ? (
                            <div className="text-center py-16">
                                <InboxIcon className="h-12 w-12 mx-auto text-gray-300" />
                                <p className="mt-3 text-sm text-gray-500">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {items.map((notification) => {
                                    const Icon = getIcon(notification.type);
                                    return (
                                        <div
                                            key={notification.id}
                                            className={`px-6 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer ${
                                                !notification.is_read ? 'bg-blue-50/20 border-l-2 border-blue-500' : ''
                                            }`}
                                            onClick={() => {
                                                if (!notification.is_read) {
                                                    markAsRead(notification.id);
                                                }
                                                if (notification.data?.route) {
                                                    window.location.href = notification.data.route;
                                                }
                                            }}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    <Icon className="h-5 w-5 text-[#6F4E37]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {notification.title}
                                                        </p>
                                                        {!notification.is_read && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                                New
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-0.5">
                                                        {notification.message}
                                                    </p>
                                                    {notification.data?.reference_number && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Reference: #{notification.data.reference_number}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1.5">
                                                        {formatDate(notification.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {notifications.links && notifications.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-100">
                                <div className="flex flex-wrap justify-center gap-1">
                                    {notifications.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                                link.active
                                                    ? 'bg-[#6F4E37] text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
