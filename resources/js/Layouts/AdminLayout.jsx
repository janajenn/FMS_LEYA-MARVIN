import { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NotificationBell from '@/Components/NotificationBell';

// Heroicons
import {
    HomeIcon,
    UserGroupIcon,
    ClockIcon,
    CameraIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    BanknotesIcon,
    ArrowUpTrayIcon,
    ChartBarIcon,
    CubeIcon,
    TruckIcon,
    FolderIcon,
    ShoppingBagIcon,
    MapPinIcon,
    DocumentArrowUpIcon,
    UsersIcon,
    ClipboardDocumentListIcon,
    DocumentTextIcon,
      QuestionMarkCircleIcon, // ✅ Add this line

} from '@heroicons/react/24/outline';

const STORAGE_KEY = 'admin_sidebar_expanded';

export default function AdminLayout({ children, title = 'Admin Dashboard' }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigationGroups = [
        {
            key: 'main',
            label: 'Main',
            items: [
                { name: 'Dashboard', href: route('admin.dashboard'), icon: HomeIcon },

            ],
        },
        {
            key: 'procurement',
            label: 'Procurement & Inventory',
            items: [
                { name: 'Materials', href: route('admin.materials.index'), icon: CubeIcon },
                { name: 'Suppliers', href: route('admin.suppliers.index'), icon: TruckIcon },
                { name: 'Material Requests', href: route('admin.material-requests.index'), icon: ClipboardDocumentListIcon },
                { name: 'Purchase Orders', href: route('admin.purchase-orders.index'), icon: DocumentTextIcon },
                { name: 'Stock In', href: route('admin.stock-in.index'), icon: ArrowUpTrayIcon },

            ],
        },
        {
            key: 'products',
            label: 'Products',
            items: [
                { name: 'Categories', href: route('admin.product-categories.index'), icon: FolderIcon },
                { name: 'Products', href: route('admin.products.index'), icon: ShoppingBagIcon },
                {
    name: 'Orders',
    href: route('admin.orders.index'),
    icon: ShoppingBagIcon,
}
            ],
        },
        {
            key: 'Delivery',
            label: 'Delivery',
            items: [
                { name: 'Delivery Zones', href: route('admin.delivery-zones.index'), icon: MapPinIcon },
            ],
        },
        {
            key: 'hr',
            label: 'HR & Payroll',
            items: [
                { name: 'Employees', href: route('admin.employees.index'), icon: UserGroupIcon },
                { name: 'Attendance', href: route('admin.attendance.index'), icon: ClockIcon },
                { name: 'Scan QR', href: route('admin.attendance.scan'), icon: CameraIcon },
                { name: 'Payroll', href: route('admin.payrolls.index'), icon: BanknotesIcon },
            ],
        },


         {
    name: 'Help',
     label: 'Help',
    items: [
        { name: 'Material Calculation', href: route('admin.help.material-calculation'), icon: QuestionMarkCircleIcon },
    ],
},



        {
            key: 'system',
            label: 'Reports & System',
            items: [
                { name: 'Sales Report', href: route('admin.reports.dashboard'), icon: ChartBarIcon },
                { name: 'User Management', href: route('admin.users.index'), icon: UsersIcon },

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

    // ✨ Refined navigation items – clean, no animations, subtle active/hover
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
                        transition-colors duration-150
                        ${isActive
                            ? 'bg-white/15 text-white'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }
                    `}
                    onClick={mobile ? () => setSidebarOpen(false) : undefined}
                >
                    {/* Solid left indicator – no pulse, no glow */}
                    {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white" />
                    )}
                    <Icon className={`
                        h-5 w-5 flex-shrink-0
                        ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                    `} />
                    <span>{item.name}</span>
                </Link>
            );
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={title} />

            {/* ===== TOP BAR ===== */}
            <nav className="bg-[#D4B8A0]/90 backdrop-blur-sm sticky top-0 z-30 shadow-sm border-b border-[#B8956E]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-white/20 focus:outline-none transition-colors duration-200 lg:hidden"
                            >
                                <span className="sr-only">Open sidebar</span>
                                <Bars3Icon className="h-6 w-6" />
                            </button>
                            <Link href="/" className="flex items-center space-x-2 lg:space-x-3">
                                <ApplicationLogo className="block h-16 w-auto" />
                                <span className="font-bold text-xl text-gray-800 tracking-tight hidden sm:inline">FMS</span>
                            </Link>
                            <span className="hidden lg:inline text-sm font-medium text-gray-700 border-l border-[#B8956E] pl-3">
                                {title}
                            </span>
                        </div>

                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="relative hidden sm:block">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="block w-36 md:w-48 lg:w-64 pl-9 pr-3 py-1.5 text-sm border border-[#B8956E] rounded-full bg-white/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B6B4F] focus:border-transparent transition-all duration-200 placeholder-gray-500 text-gray-800"
                                />
                            </div>

                            <NotificationBell />

                            <div className="flex items-center space-x-1">
                                <div className="h-8 w-8 rounded-full bg-[#B8956E] flex items-center justify-center text-white text-sm font-medium ring-2 ring-white ring-offset-1 ring-offset-[#D4B8A0]">
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <Dropdown align="right" width="48">
                                    <Dropdown.Trigger>
                                        <button className="inline-flex items-center px-1 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-transparent hover:text-gray-900 focus:outline-none transition-colors duration-150">
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
                <div className="h-0.5 bg-gradient-to-r from-transparent via-[#B8956E] to-transparent opacity-60" />
            </nav>

            {/* ===== SIDEBAR ===== */}
            <div className="flex">
                {/* Desktop sidebar */}
                <aside className="hidden lg:block lg:flex-shrink-0 lg:w-64 bg-[#6F4E37] text-white h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
                    <div className="p-4 border-b border-[#5A3E2B]">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-[#5A3E2B] flex items-center justify-center text-white font-medium text-sm ring-2 ring-[#8B6B4F]">
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

                {/* Mobile sidebar */}
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
                            <div className="fixed inset-0 bg-[#6F4E37]/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                        </Transition.Child>
                        <Transition.Child
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#6F4E37] text-white shadow-xl">
                                <div className="flex items-center justify-between p-4 border-b border-[#5A3E2B]">
                                    <Link href="/" className="flex items-center space-x-2">
                                        <ApplicationLogo className="h-8 w-auto fill-current text-white" />
                                        <span className="font-bold text-xl text-white tracking-tight">FMS</span>
                                    </Link>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="p-1 rounded-md text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none transition-colors"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="p-4 border-b border-[#5A3E2B]">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-[#5A3E2B] flex items-center justify-center text-white font-medium text-sm ring-2 ring-[#8B6B4F]">
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

                {/* Main content */}
                <main className="flex-1 p-2 sm:p-3 lg:p-4 bg-gray-50/50">
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
