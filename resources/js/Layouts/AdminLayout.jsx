import { useState, useEffect, Fragment } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Transition, Dialog } from '@headlessui/react';
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
    MagnifyingGlassIcon,
    BanknotesIcon,
    ArrowUpTrayIcon,
    ChartBarIcon,
    CubeIcon,
    TruckIcon,
    FolderIcon,
    ShoppingBagIcon,
    MapPinIcon,
    UsersIcon,
    ClipboardDocumentListIcon,
    DocumentTextIcon,
    QuestionMarkCircleIcon,
    ExclamationTriangleIcon,
    ArrowsPointingOutIcon,        // ← NEW
} from '@heroicons/react/24/outline';

const STORAGE_KEY = 'admin_sidebar_expanded';

export default function AdminLayout({ children, title = 'Admin Dashboard' }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const navigationGroups = [
        {
            key: 'main',
            label: 'Main',
            items: [
                { name: 'Dashboard', href: route('admin.dashboard'), icon: HomeIcon },
                { name: 'Orders', href: route('admin.orders.index'), icon: ShoppingBagIcon },
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
                // { name: 'Stock In', href: route('admin.stock-in.index'), icon: ArrowUpTrayIcon },
            ],
        },
        {
            key: 'products',
            label: 'Products',
            items: [
                { name: 'Categories', href: route('admin.product-categories.index'), icon: FolderIcon },
                { name: 'Standard Sizes', href: route('admin.product-size-templates.index'), icon: ArrowsPointingOutIcon },   // ← NEW
                { name: 'Products', href: route('admin.products.index'), icon: ShoppingBagIcon },

            ],
        },
        {
            key: 'delivery',
            label: 'Delivery',
            items: [
                { name: 'Delivery Zones', href: route('admin.delivery-zones.index'), icon: MapPinIcon },
            ],
        },
        {
            key: 'hr',
            label: 'Employee Management',
            items: [
                { name: 'Employees', href: route('admin.employees.index'), icon: UserGroupIcon },
                // { name: 'Attendance', href: route('admin.attendance.index'), icon: ClockIcon },
                // { name: 'Scan QR', href: route('admin.attendance.scan'), icon: CameraIcon },
                // { name: 'Payroll', href: route('admin.payrolls.index'), icon: BanknotesIcon },
            ],
        },
        {
            key: 'help',
            label: 'Help',
            items: [
                { name: 'Material Calculation', href: route('admin.help.material-calculation'), icon: QuestionMarkCircleIcon },
            ],
        },
        {
            key: 'system',
            label: ' System & Reports',
            items: [
                { name: ' Report', href: route('admin.reports.dashboard'), icon: ChartBarIcon },
                { name: 'User Management', href: route('admin.users.index'), icon: UsersIcon },
            ],
        },
    ];

    const getInitialExpanded = () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const validKeys = new Set(navigationGroups.map((g) => g.key));
                const filtered = Object.keys(parsed)
                    .filter((key) => validKeys.has(key))
                    .reduce((obj, key) => {
                        obj[key] = parsed[key];
                        return obj;
                    }, {});
                if (Object.keys(filtered).length > 0) return filtered;
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

    const toggleGroup = (key) =>
        setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isItemActive = (item) =>
        currentPath === item.href || currentPath.startsWith(item.activePrefix || '');

    const confirmLogout = () => {
        setShowLogoutModal(false);
        router.post(route('logout'));
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    // ✨ Clean nav item
    const renderNavItems = (items, mobile = false) =>
        items.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            return (
                <Link
                    key={item.name}
                    href={item.href}
                    onClick={mobile ? () => setSidebarOpen(false) : undefined}
                    className={`
                        group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                        transition-colors duration-200
                        ${isActive
                            ? 'bg-white/15 text-white'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }
                    `}
                >
                    {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white" />
                    )}
                    <Icon
                        className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                            isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                        }`}
                    />
                    <span className="truncate">{item.name}</span>
                </Link>
            );
        });

    // ✨ Smooth accordion group
    const renderGroup = (group, mobile = false) => {
        const isExpanded = !!expandedGroups[group.key];
        return (
            <div key={group.key} className="mb-0.5">
                <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 transition-colors duration-200 hover:text-white"
                >
                    <span>{group.label}</span>
                    <ChevronDownIcon
                        className={`h-4 w-4 transition-transform duration-300 ease-out ${
                            isExpanded ? 'rotate-180' : 'rotate-0'
                        }`}
                    />
                </button>

                <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                        isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                >
                    <div className="overflow-hidden">
                        <div className="mt-1 space-y-0.5 pl-1">
                            {renderNavItems(group.items, mobile)}
                        </div>
                    </div>
                </div>
            </div>
        );
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
                                        <button
                                            type="button"
                                            onClick={() => setShowLogoutModal(true)}
                                            className="block w-full px-4 py-2 text-left text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                        >
                                            Log Out
                                        </button>
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
                <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 bg-gradient-to-b from-[#6F4E37] to-[#5A3E2B] text-white h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
                    <div className="flex items-center gap-3 px-4 py-4">
                        <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-medium ring-1 ring-white/20">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-gray-300/80 truncate">{user.role?.name || 'User'}</p>
                        </div>
                    </div>

                    <div className="h-px bg-white/10 mx-4" />

                    <nav className="flex-1 px-2 py-3">
                        {navigationGroups.map((group) => renderGroup(group))}
                    </nav>
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
                            <div
                                className="fixed inset-0 bg-[#6F4E37]/60 backdrop-blur-sm"
                                onClick={() => setSidebarOpen(false)}
                            />
                        </Transition.Child>

                        <Transition.Child
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-[#6F4E37] to-[#5A3E2B] text-white shadow-xl">
                                <div className="flex items-center justify-between p-4 border-b border-white/10">
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

                                <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
                                    <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-medium ring-1 ring-white/20">
                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                        <p className="text-xs text-gray-300/80 truncate">{user.role?.name || 'User'}</p>
                                    </div>
                                </div>

                                <nav className="flex-1 px-2 py-3 overflow-y-auto">
                                    {navigationGroups.map((group) => renderGroup(group, true))}
                                </nav>
                            </div>
                        </Transition.Child>
                    </div>
                </Transition>

                {/* Main content */}
                <main className="flex-1 p-2 sm:p-3 lg:p-4 bg-gray-50/50">
                    <div className="w-full">{children}</div>
                </main>
            </div>

            {/* ===== LOGOUT CONFIRMATION MODAL ===== */}
            <Transition show={showLogoutModal} as={Fragment}>
                <Dialog
                    onClose={() => setShowLogoutModal(false)}
                    className="relative z-50"
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <Dialog.Title className="text-base font-semibold text-gray-900">
                                            Confirm Log Out
                                        </Dialog.Title>
                                        <Dialog.Description className="mt-1 text-sm text-gray-500">
                                            Are you sure you want to log out? You'll need to sign in again to access your account.
                                        </Dialog.Description>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowLogoutModal(false)}
                                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmLogout}
                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
