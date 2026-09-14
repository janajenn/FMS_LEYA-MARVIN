import { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    BellIcon,
    BellAlertIcon,
    DocumentTextIcon,
    ClipboardDocumentListIcon,
    ArchiveBoxIcon,
    ArrowPathIcon,
    InboxIcon,
} from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';
import axios from 'axios';

export default function NotificationBell() {
    const { auth, unreadNotifications } = usePage().props;
    const user = auth?.user;
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(unreadNotifications || 0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const pollingInterval = useRef(null);

    // ✅ Role-specific "View all" route
    const viewAllRoute = user?.role?.slug === 'admin'
        ? route('admin.notifications.index')
        : route('manager.notifications.index');

    // Polling for new notifications (every 15 seconds)
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await axios.get('/notifications/unread-count');
                setUnreadCount(response.data.count || 0);
            } catch (error) {
                // ignore
            }
        };

        pollingInterval.current = setInterval(fetchUnreadCount, 15000);
        return () => clearInterval(pollingInterval.current);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/notifications/json');
            const data = response.data;
            setNotifications(Array.isArray(data) ? data : []);
            const unread = (Array.isArray(data) ? data : []).filter(n => !n.is_read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleDropdown = async () => {
        if (!isOpen) {
            await fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    const markAsRead = async (id) => {
        try {
            await axios.post(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.post('/notifications/mark-all-read');
            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }
        if (notification.data?.route) {
            window.location.href = notification.data.route;
        }
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

    const getIcon = (type) => {
        const icons = {
            material_request: DocumentTextIcon,
            purchase_order: ClipboardDocumentListIcon,
            goods_receipt: ArchiveBoxIcon,
            replacement_request: ArrowPathIcon,
        };
        return icons[type] || InboxIcon;
    };

    const displayNotifications = Array.isArray(notifications) ? notifications.slice(0, 20) : [];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative p-1.5 rounded-full text-white hover:text-gray-200 hover:bg-white/10 transition-colors duration-200 focus:outline-none"
            >
                {unreadCount > 0 ? (
                    <BellAlertIcon className="h-5 w-5" />
                ) : (
                    <BellIcon className="h-5 w-5" />
                )}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <Transition
                show={isOpen}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100/50 overflow-hidden z-50 max-h-[500px] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs font-medium text-[#6F4E37] hover:text-[#5A3E2B] transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                            <Link
                                href={viewAllRoute}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                View all
                            </Link>
                        </div>
                    </div>

                    {/* Notifications list */}
                    <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6F4E37]"></div>
                            </div>
                        ) : displayNotifications.length === 0 ? (
                            <div className="text-center py-8">
                                <InboxIcon className="h-10 w-10 mx-auto text-gray-300" />
                                <p className="mt-2 text-sm text-gray-400">No notifications</p>
                            </div>
                        ) : (
                            displayNotifications.map((notification) => {
                                const Icon = getIcon(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer ${
                                            !notification.is_read ? 'bg-blue-50/30 border-l-2 border-blue-500' : ''
                                        }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <Icon className="h-5 w-5 text-[#6F4E37]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    {notification.message}
                                                </p>
                                                {notification.data?.reference_number && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        #{notification.data.reference_number}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDate(notification.created_at)}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <span className="flex-shrink-0 mt-1 ml-1 w-2 h-2 rounded-full bg-blue-500"></span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {displayNotifications.length > 0 && notifications.length > 20 && (
                        <div className="px-4 py-2 border-t border-gray-100 text-center">
                            <Link
                                href={viewAllRoute}
                                className="text-xs font-medium text-[#6F4E37] hover:text-[#5A3E2B] transition-colors"
                            >
                                View all {notifications.length} notifications
                            </Link>
                        </div>
                    )}
                </div>
            </Transition>
        </div>
    );
}
