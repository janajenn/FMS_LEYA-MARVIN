// DeliveryDriverLayout.tsx
import { useState, Fragment } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Transition, Dialog } from '@headlessui/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';

// Heroicons
import {
    HomeIcon,
    ClipboardDocumentListIcon,
    ChevronDownIcon,
    Bars3Icon,
    XMarkIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function DeliveryDriverLayout({ children, title = 'Driver Dashboard' }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-pulse text-stone-400 text-sm font-medium tracking-wide">
                    Loading...
                </div>
            </div>
        );
    }

    const navigation = [
        { name: 'Dashboard', href: route('driver.dashboard'), icon: HomeIcon },
        { name: 'Deliveries', href: route('driver.deliveries.index'), icon: ClipboardDocumentListIcon },
    ];

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isItemActive = (item) =>
        currentPath === item.href || currentPath.startsWith(item.activePrefix || '');

    const confirmLogout = () => {
        setShowLogoutModal(false);
        router.post(route('logout'));
    };

    // ✨ Clean, shared nav renderer (desktop + mobile)
    const renderNav = (mobile = false) =>
        navigation.map((item) => {
            const isActive = isItemActive(item);
            const Icon = item.icon;
            return (
                <Link
                    key={item.name}
                    href={item.href}
                    onClick={mobile ? () => setSidebarOpen(false) : undefined}
                    className={`
                        group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium
                        transition-colors duration-200
                        ${isActive
                            ? 'bg-[#F8F5F2] text-stone-900'
                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                        }
                    `}
                >
                    {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[#A67B5B]" />
                    )}
                    <Icon
                        className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                            isActive ? 'text-[#A67B5B]' : 'text-stone-400 group-hover:text-[#A67B5B]'
                        }`}
                    />
                    <span className="truncate">{item.name}</span>
                </Link>
            );
        });

    return (
        <div className="min-h-screen bg-stone-50">
            <Head title={title} />

            {/* ─────────────────────────────────────────────
                TOP BAR
            ───────────────────────────────────────────── */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-200/60 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: logo + menu toggle */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C4A484]/40"
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>

                            <Link href="/" className="flex items-center gap-2 group">
                                <ApplicationLogo className="block h-10 w-auto" />
                                <span className="font-semibold text-xl text-stone-800 tracking-tight hidden sm:inline">
                                    FMS
                                </span>
                            </Link>

                            <div className="hidden lg:flex items-center">
                                <div className="h-6 w-px bg-stone-200 mx-3" />
                                <span className="text-sm font-medium text-stone-500 tracking-wide">
                                    {title}
                                </span>
                            </div>
                        </div>

                        {/* Right: user info + dropdown */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#C4A484] to-[#A67B5B] flex items-center justify-center text-white text-sm font-medium shadow-sm ring-2 ring-white/80">
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="hidden sm:inline text-sm font-medium text-stone-700">
                                    {user.name}
                                </span>
                            </div>

                            <Dropdown align="right" width="56">
                                <Dropdown.Trigger>
                                    <button className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100/80 transition-colors duration-150 focus:outline-none">
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content className="mt-2 rounded-2xl shadow-xl border border-stone-100/80 backdrop-blur-sm bg-white/90">
                                    <div className="px-4 py-3 border-b border-stone-100/60">
                                        <p className="text-sm font-semibold text-stone-800 truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-stone-500 mt-0.5 truncate">
                                            {user.role?.name || 'Driver'}
                                        </p>
                                    </div>
                                    <Dropdown.Link href={route('profile.edit')} className="hover:bg-stone-50">
                                        Profile
                                    </Dropdown.Link>
                                    <button
                                        type="button"
                                        onClick={() => setShowLogoutModal(true)}
                                        className="block w-full px-4 py-2 text-left text-sm leading-5 text-rose-600 transition duration-150 ease-in-out hover:bg-stone-50 focus:bg-stone-50 focus:outline-none"
                                    >
                                        Log Out
                                    </button>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </header>

            {/* ─────────────────────────────────────────────
                SIDEBAR + MAIN CONTENT
            ───────────────────────────────────────────── */}
            <div className="flex">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white/80 backdrop-blur-sm border-r border-stone-200/60">
                    {/* User card */}
                    <div className="px-5 py-5">
                        <div className="flex items-center gap-3.5">
                            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#C4A484] to-[#A67B5B] flex items-center justify-center text-white font-medium text-sm ring-2 ring-[#C4A484]/30">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-stone-800 truncate leading-tight">
                                    {user.name}
                                </p>
                                <p className="text-xs text-stone-500 mt-0.5 truncate">
                                    {user.role?.name || 'Driver'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-stone-200/60 mx-5" />

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-3 space-y-0.5">
                        {renderNav()}
                    </nav>

                    {/* Footer */}
                    <div className="px-5 py-4 border-t border-stone-200/60 text-xs text-stone-400 text-center">
                        © {new Date().getFullYear()} FMS
                    </div>
                </aside>

                {/* Mobile Sidebar */}
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
                                className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm"
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
                            <div className="relative flex flex-col w-full max-w-xs bg-white/95 backdrop-blur-xl shadow-2xl border-r border-stone-200/60">
                                {/* Header */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/60">
                                    <Link
                                        href="/"
                                        className="flex items-center gap-2.5"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <ApplicationLogo className="h-8 w-auto" />
                                        <span className="font-semibold text-lg text-stone-800 tracking-tight">
                                            FMS
                                        </span>
                                    </Link>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="p-2 -mr-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100/80 transition-colors"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* User */}
                                <div className="px-5 py-5 border-b border-stone-200/60">
                                    <div className="flex items-center gap-3.5">
                                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#C4A484] to-[#A67B5B] flex items-center justify-center text-white font-medium text-sm ring-2 ring-[#C4A484]/30">
                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-stone-800 truncate">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-stone-500 mt-0.5 truncate">
                                                {user.role?.name || 'Driver'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Nav links */}
                                <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                                    {renderNav(true)}
                                </nav>

                                {/* Footer */}
                                <div className="px-5 py-4 border-t border-stone-200/60 text-xs text-stone-400 text-center">
                                    © {new Date().getFullYear()} FMS
                                </div>
                            </div>
                        </Transition.Child>
                    </div>
                </Transition>

                {/* Main content */}
                <main className="flex-1 min-w-0">
                    <div className="p-5 sm:p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>

            {/* ─────────────────────────────────────────────
                LOGOUT CONFIRMATION MODAL
            ───────────────────────────────────────────── */}
            <Transition show={showLogoutModal} as={Fragment}>
                <Dialog onClose={() => setShowLogoutModal(false)} className="relative z-50">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm" />
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
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-100">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-rose-600" />
                                    </div>
                                    <div className="flex-1">
                                        <Dialog.Title className="text-base font-semibold text-stone-900">
                                            Confirm Log Out
                                        </Dialog.Title>
                                        <Dialog.Description className="mt-1 text-sm text-stone-500">
                                            Are you sure you want to log out? You'll need to sign in again to access your account.
                                        </Dialog.Description>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowLogoutModal(false)}
                                        className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmLogout}
                                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
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
