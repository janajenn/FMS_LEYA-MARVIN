// DeliveryDriverLayout.tsx
import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';

// Heroicons
import {
    HomeIcon,
    TruckIcon,
    ClipboardDocumentListIcon,
    UserCircleIcon,
    ChevronDownIcon,
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

export default function DeliveryDriverLayout({ children, title = 'Driver Dashboard' }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
        // { name: 'Deliveries', href: route('driver.deliveries.index'), icon: ClipboardDocumentListIcon },
        // more
    ];

    const currentPath = window.location.pathname;

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
                                <ApplicationLogo className="block h-10 w-auto transition-transform duration-300 group-hover:scale-105" />
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
                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="hover:bg-stone-50 text-rose-600"
                                    >
                                        Log Out
                                    </Dropdown.Link>
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
                <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white/80 backdrop-blur-sm border-r border-stone-200/60 shadow-sm">
                    {/* User card */}
                    <div className="px-5 py-6 border-b border-stone-200/60">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#C4A484] to-[#A67B5B] flex items-center justify-center text-white font-medium text-sm ring-2 ring-[#C4A484]/30 shadow-inner">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-stone-800 truncate leading-tight">
                                    {user.name}
                                </p>
                                <p className="text-xs text-stone-500 mt-0.5 truncate flex items-center gap-1">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    {user.role?.name || 'Driver'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-5 space-y-1">
                        {navigation.map((item) => {
                            const isActive =
                                currentPath === item.href ||
                                currentPath.startsWith(item.activePrefix || '');
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                                        group relative flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium
                                        transition-all duration-200 ease-out
                                        ${
                                            isActive
                                                ? 'bg-[#F8F5F2] text-stone-900 shadow-sm'
                                                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                                        }
                                    `}
                                >
                                    {isActive && (
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-[#C4A484] to-[#A67B5B]" />
                                    )}

                                    <Icon
                                        className={`
                                            h-5 w-5 flex-shrink-0 transition-all duration-200
                                            ${isActive ? 'text-[#A67B5B]' : 'text-stone-400 group-hover:text-[#A67B5B]'}
                                            group-hover:scale-110
                                        `}
                                    />
                                    <span className="truncate">{item.name}</span>

                                    {isActive && (
                                        <span className="ml-auto flex items-center">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A67B5B]/40 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A67B5B]" />
                                            </span>
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
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
                                            <p className="text-xs text-stone-500 mt-0.5 truncate flex items-center gap-1">
                                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                {user.role?.name || 'Driver'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Nav links */}
                                <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                                    {navigation.map((item) => {
                                        const isActive =
                                            currentPath === item.href ||
                                            currentPath.startsWith(item.activePrefix || '');
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`
                                                    group relative flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium
                                                    transition-all duration-200 ease-out
                                                    ${
                                                        isActive
                                                            ? 'bg-[#F8F5F2] text-stone-900 shadow-sm'
                                                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                                                    }
                                                `}
                                            >
                                                {isActive && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-[#C4A484] to-[#A67B5B]" />
                                                )}

                                                <Icon
                                                    className={`
                                                        h-5 w-5 flex-shrink-0 transition-all duration-200
                                                        ${isActive ? 'text-[#A67B5B]' : 'text-stone-400 group-hover:text-[#A67B5B]'}
                                                        group-hover:scale-110
                                                    `}
                                                />
                                                <span className="truncate">{item.name}</span>

                                                {isActive && (
                                                    <span className="ml-auto flex items-center">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A67B5B]/40 opacity-75" />
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A67B5B]" />
                                                        </span>
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
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
        </div>
    );
}
