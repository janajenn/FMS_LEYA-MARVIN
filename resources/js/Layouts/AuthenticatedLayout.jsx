import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import { Transition } from '@headlessui/react';

export default function AuthenticatedLayout({ children }) {
    const { auth = { user: null }, flash = {} } = usePage().props;
    const user = auth?.user;

    // If no user, show a loading state (shouldn't happen under auth middleware)
    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const getNavItems = () => {
        const common = [
            { name: 'Dashboard', href: route('dashboard'), icon: 'home' },
        ];

        const routes = window.Ziggy?.routes || {};
        const roleNav = {
            admin: [],
            manager: [],
            driver: [],
            customer: [],
        };

        if (routes['materials.index']) {
            roleNav.admin.push({ name: 'Raw Materials', href: route('materials.index'), icon: 'box' });
        }

        if (routes['products.index']) {
    roleNav.admin.push({ name: 'Products', href: route('products.index'), icon: 'shopping-bag' });
}

if (routes['shop.index']) {
    roleNav.customer.push({ name: 'Shop', href: route('shop.index'), icon: 'shopping-bag' });
}
        // Add more as you build phases

        const roleItems = roleNav[user?.role?.slug] || [];
        return [...common, ...roleItems];
    };

    const navItems = getNavItems();

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top navigation - same as before */}
            <nav className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
                            >
                                <span className="sr-only">Open sidebar</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <Link href="/" className="flex items-center space-x-2">
                                <ApplicationLogo className="block h-10 w-auto fill-current text-gray-800" />
                                <span className="font-bold text-xl">FMS</span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">{user.name}</span>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150">
                                        <span className="mr-1">{user.role?.name || 'No Role'}</span>
                                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Sidebar and main content - same as before */}
            <div className="flex">
                <aside className="hidden lg:block lg:flex-shrink-0 lg:w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
                    <div className="p-4 space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                href={item.href}
                                active={route().current(item.href)}
                                className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                <span>{item.name}</span>
                            </NavLink>
                        ))}
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
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                        </Transition.Child>
                        <Transition.Child
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                                <div className="p-4 border-b border-gray-200">
                                    <Link href="/" className="flex items-center space-x-2">
                                        <ApplicationLogo className="h-8 w-auto fill-current text-gray-800" />
                                        <span className="font-bold text-xl">FMS</span>
                                    </Link>
                                </div>
                                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                                    {navItems.map((item) => (
                                        <NavLink
                                            key={item.name}
                                            href={item.href}
                                            active={route().current(item.href)}
                                            className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium"
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <span>{item.name}</span>
                                        </NavLink>
                                    ))}
                                </nav>
                            </div>
                        </Transition.Child>
                    </div>
                </Transition>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
