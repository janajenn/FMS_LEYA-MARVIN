import { useState, useEffect  } from 'react';
import { Head, Link, usePage  } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NotificationBell from '@/Components/NotificationBell'; // ✅ Added

// Heroicons
import {
    HomeIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    TruckIcon,
    FolderIcon,
    ShoppingBagIcon,
    MapPinIcon,
    CubeIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    CheckBadgeIcon,
    UserGroupIcon,
    CreditCardIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

const STORAGE_KEY = 'manager_sidebar_expanded';

export default function ManagerLayout({ children, title = 'Manager Dashboard' }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigationGroups = [
        {
            key: 'main',
            label: 'Main',
            items: [
                { name: 'Dashboard', href: route('manager.dashboard'), icon: HomeIcon },
            ],
        },
        {
            key: 'procurement',
            label: 'Procurement & Inventory',
            items: [
                { name: 'Suppliers', href: route('manager.suppliers.index'), icon: TruckIcon },
                { name: 'Review Requests', href: route('manager.procurement.review.index'), icon: ClipboardDocumentListIcon },
                { name: 'Confirm Receipts', href: route('manager.procurement.confirm.index'), icon: CheckBadgeIcon },
            ],
        },
        {
            key: 'products',
            label: 'Products',
            items: [
                { name: 'Categories', href: route('manager.product-categories.index'), icon: FolderIcon },
                { name: 'Products', href: route('manager.products.index'), icon: ShoppingBagIcon },
                 { name: 'Payments', href: route('manager.payments.index'), icon: CreditCardIcon },

            ],
        },
        {
            key: 'fulfillment',
            label: 'Fulfillment',
            items: [
                { name: 'Delivery Zones', href: route('manager.delivery-zones.index'), icon: MapPinIcon },
            ],
        },
        {
            key: 'reports',
            label: 'Reports',
            items: [
                { name: 'Reports', href: route('manager.reports.dashboard'), icon: ChartBarIcon },
                { name: 'Orders', href: route('manager.orders.index'), icon: ShoppingBagIcon },
            ],
        },
    ];

    const getInitialExpanded = () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const validKeys = new Set(navigationGroups.map(g => g.key));
                const filtered = Object.keys(parsed)
                    .filter(key => validKeys.has(key))
                    .reduce((obj, key) => {
                        obj[key] = parsed[key];
                        return obj;
                    }, {});
                if (Object.keys(filtered).length > 0) {
                    return filtered;
                }
            } catch (e) {
                // ignore
            }
        }
        const currentPath = window.location.pathname;
        const defaultOpen = {};
        navigationGroups.forEach((group) => {
            const hasActive = group.items.some(
                (item) => currentPath === item.href || currentPath.startsWith(item.activePrefix || '')
            );
            if (hasActive) defaultOpen[group.key] = true;
        });
        return defaultOpen;
    };

    const [expandedGroups, setExpandedGroups] = useState(getInitialExpanded);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedGroups));
    }, [expandedGroups]);

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-gray-500">Loading...</div>
        </div>
    );

    const toggleGroup = (key) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const currentPath = window.location.pathname;

    const isItemActive = (item) => {
        return currentPath === item.href || currentPath.startsWith(item.activePrefix || '');
    };

    const renderNavItems = (items, mobile = false) => {
        return items.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            return (
                <Link
                    key={item.name}
                    href={item.href}
                    className={`
                        group relative flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-200 ease-out
                        hover:translate-x-1 hover:scale-[1.02]
                        ${isActive
                            ? 'bg-white/15 text-white shadow-sm shadow-white/5'
                            : 'text-gray-200 hover:bg-white/10 hover:text-white'
                        }
                    `}
                    onClick={mobile ? () => setSidebarOpen(false) : undefined}
                >
                    {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                    )}
                    <Icon className={`
                        h-5 w-5 flex-shrink-0 transition-transform duration-200
                        group-hover:scale-110
                        ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}
                    `} />
                    <span>{item.name}</span>
                    {isActive && (
                        <span className="ml-auto flex items-center">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white/90"></span>
                            </span>
                        </span>
                    )}
                </Link>
            );
        });
    };

    const topBarColor = '#6B5A3E';

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={title} />

            {/* Top Navigation */}
            <nav
                className="sticky top-0 z-30 shadow-sm border-b border-[#5C4E34]"
                style={{ backgroundColor: topBarColor }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-md text-gray-200 hover:text-white hover:bg-white/10 focus:outline-none transition-colors duration-200 lg:hidden"
                            >
                                <span className="sr-only">Open sidebar</span>
                                <Bars3Icon className="h-6 w-6" />
                            </button>
                            <Link href="/" className="flex items-center space-x-3 lg:space-x-4">
                                <ApplicationLogo className="block h-16 w-auto fill-current text-white" />
                                <span className="font-bold text-2xl text-white tracking-tight hidden sm:inline">FMS</span>
                            </Link>
                            <span className="hidden lg:inline text-sm font-medium text-gray-200 border-l border-[#5C4E34] pl-3">
                                {title}
                            </span>
                        </div>

                        <div className="flex items-center space-x-3 sm:space-x-4">
                            {/* ✅ Notification Bell – added here */}
                            <NotificationBell />

                            <div className="flex items-center space-x-1">
                                <div className="h-8 w-8 rounded-full bg-[#5C4E34] flex items-center justify-center text-white text-sm font-medium ring-2 ring-white/20">
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <Dropdown align="right" width="48">
                                    <Dropdown.Trigger>
                                        <button className="inline-flex items-center px-1 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-200 bg-transparent hover:text-white focus:outline-none transition-colors duration-150">
                                            <ChevronDownIcon className="h-4 w-4" />
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.role?.name || 'User'}</p>
                                        </div>
                                        <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button">
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </nav>

            {/* Sidebar – unchanged */}
            <div className="flex">
                <aside
                    className="hidden lg:block lg:flex-shrink-0 lg:w-64 text-white h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto"
                    style={{ backgroundColor: '#3f301d' }}
                >
                    <div className="p-4 border-b border-[#2a1f14]">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-[#2a1f14] flex items-center justify-center text-white font-medium text-sm ring-2 ring-[#5C4E34]">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                <p className="text-xs text-gray-300 truncate">{user.role?.name || 'User'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2 space-y-1">
                        {navigationGroups.map((group) => {
                            const isExpanded = expandedGroups[group.key];
                            return (
                                <div key={group.key} className="mb-1">
                                    <button
                                        onClick={() => toggleGroup(group.key)}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-150"
                                    >
                                        <span className="uppercase tracking-wider">{group.label}</span>
                                        {isExpanded ? (
                                            <ChevronDownIcon className="h-4 w-4" />
                                        ) : (
                                            <ChevronRightIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                    {isExpanded && (
                                        <div className="ml-2 space-y-1 mt-1">
                                            {renderNavItems(group.items)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </aside>

                <Transition show={sidebarOpen}>
                    <div className="fixed inset-0 z-40 flex lg:hidden">
                        <Transition.Child
                            enter="transition-opacity ease-linear duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity ease-linear duration-300"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                        </Transition.Child>
                        <Transition.Child
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <div className="relative flex-1 flex flex-col max-w-xs w-full text-white shadow-xl" style={{ backgroundColor: '#3f301d' }}>
                                <div className="flex items-center justify-between p-4 border-b border-[#2a1f14]">
                                    <Link href="/" className="flex items-center space-x-2">
                                        <ApplicationLogo className="h-16 w-auto fill-current text-white" />
                                        <span className="font-bold text-xl text-white tracking-tight">FMS</span>
                                    </Link>
                                    <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-md text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none transition-colors">
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="p-4 border-b border-[#2a1f14]">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-[#2a1f14] flex items-center justify-center text-white font-medium text-sm ring-2 ring-[#5C4E34]">
                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                            <p className="text-xs text-gray-300 truncate">{user.role?.name || 'User'}</p>
                                        </div>
                                    </div>
                                </div>
                                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                                    {navigationGroups.map((group) => {
                                        const isExpanded = expandedGroups[group.key];
                                        return (
                                            <div key={group.key} className="mb-1">
                                                <button
                                                    onClick={() => toggleGroup(group.key)}
                                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-150"
                                                >
                                                    <span className="uppercase tracking-wider">{group.label}</span>
                                                    {isExpanded ? (
                                                        <ChevronDownIcon className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRightIcon className="h-4 w-4" />
                                                    )}
                                                </button>
                                                {isExpanded && (
                                                    <div className="ml-2 space-y-1 mt-1">
                                                        {renderNavItems(group.items, true)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </nav>
                            </div>
                        </Transition.Child>
                    </div>
                </Transition>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
