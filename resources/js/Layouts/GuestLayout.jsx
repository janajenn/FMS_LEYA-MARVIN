import { useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { CartProvider, useCart } from '@/Context/CartContext';
import Toast from '@/Components/Toast';
import { ShoppingCartIcon, UserIcon } from '@heroicons/react/24/outline';

// Inner component to access cart context and flash messages
function GuestLayoutContent({ children }) {
    const { auth, flash = {} } = usePage().props;
    const user = auth?.user;
    const { cartCount, setCartCount } = useCart();
    const [toasts, setToasts] = useState([]);

    // Listen for flash messages and show as toasts
    useState(() => {
        if (flash.success) {
            addToast(flash.success, 'success');
            // Increment cart count if the success is from adding to cart
            // We can detect by checking if flash contains 'cart' or we can just increment
            // We'll increment on any success that indicates a cart addition, but to be safe,
            // we'll leave it to the component to update the count via setCartCount.
        }
        if (flash.error) {
            addToast(flash.error, 'error');
        }
    }, [flash]);

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        // Auto-remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#6F4E37]/5 via-[#F5EDE8]/30 to-white">
            {/* Toast container */}
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}

            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-[#B8956E]/20 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-8">
                            <Link href="/" className="flex items-center space-x-2">
                                <ApplicationLogo className="block h-10 w-auto fill-current text-[#6F4E37]" />
                                <span className="font-bold text-xl text-gray-800 tracking-tight">FMS</span>
                            </Link>
                            <div className="hidden sm:flex sm:space-x-6">
                                <Link
                                    href={route('shop.index')}
                                    className="text-sm font-medium text-gray-600 hover:text-[#6F4E37] transition-colors"
                                >
                                    Shop
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">


                            {user ? (
                                <>
                                    <Link
                                        href={route('dashboard')}
                                        className="text-sm font-medium text-gray-600 hover:text-[#6F4E37] transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="text-sm font-medium text-gray-600 hover:text-[#6F4E37] transition-colors"
                                    >
                                        Logout
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="text-sm font-medium text-gray-600 hover:text-[#6F4E37] transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main>
                {children}
            </main>
        </div>
    );
}

export default function GuestLayout({ children }) {
    const { auth = { user: null } } = usePage().props;
    const initialCartCount = auth?.cart_count || 0;

    return (
        <CartProvider initialCartCount={initialCartCount}>
            <GuestLayoutContent>{children}</GuestLayoutContent>
        </CartProvider>
    );
}
