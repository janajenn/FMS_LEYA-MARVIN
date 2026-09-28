import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    UsersIcon,
    RectangleStackIcon,
    ArchiveBoxIcon,
    LightBulbIcon,
    PaintBrushIcon,
    SunIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    // Sample featured products — replace with real data later
    const featuredProducts = [
        {
            id: 1,
            name: 'Nordic Lounge Chair',
            price: '₱249',
            image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=450&fit=crop&crop=center',
            category: 'Seating',
        },
        {
            id: 2,
            name: 'Rustic Oak Table',
            price: '₱599',
            image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600&h=450&fit=crop&crop=center',
            category: 'Tables',
        },
        {
            id: 3,
            name: 'Modern Bookshelf',
            price: '₱379',
            image: 'https://images.unsplash.com/photo-1597019558926-4f8604b34a2f?w=600&h=450&fit=crop&crop=center',
            category: 'Storage',
        },
        {
            id: 4,
            name: 'Velvet Ottoman',
            price: '₱189',
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=450&fit=crop&crop=center',
            category: 'Seating',
        },
    ];

    const categories = [
        { name: 'Seating', icon: UsersIcon },
        { name: 'Tables', icon: RectangleStackIcon },
        { name: 'Storage', icon: ArchiveBoxIcon },
        { name: 'Lighting', icon: LightBulbIcon },
        { name: 'Decor', icon: PaintBrushIcon },
        { name: 'Outdoor', icon: SunIcon },
    ];

    return (
        <>
            <Head title="Welcome to FMS" />

            <div className="min-h-screen bg-white text-stone-800">
                {/* ─── HEADER ─── */}
                <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-100">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <Link href="/" className="flex items-center gap-2.5">
                                <ApplicationLogo className="h-8 w-auto" />
                                <span className="font-semibold text-lg tracking-tight text-stone-900">
                                    FMS
                                </span>
                            </Link>

                            <nav className="flex items-center gap-6">
                                {auth.user ? (
                                    <>
                                        <Link
                                            href={route('dashboard')}
                                            className="text-sm font-medium text-stone-600 hover:text-[#6F4E37] transition-colors"
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            href={route('shop.index')}
                                            className="text-sm font-medium text-stone-600 hover:text-[#6F4E37] transition-colors"
                                        >
                                            Shop
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="text-sm font-medium text-stone-600 hover:text-[#6F4E37] transition-colors"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-full hover:bg-[#5A3E2B] transition-colors"
                                        >
                                            Get Started
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* ─── HERO ─── */}
                <section className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-24">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left content */}
                        <div>
                            <span className="inline-block text-xs font-semibold tracking-wider text-[#6F4E37] uppercase mb-4">
                                New Collection 2026
                            </span>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900 leading-[1.1]">
                                Crafted for comfort,<br />
                                built to last.
                            </h1>
                            <p className="mt-6 text-base md:text-lg text-stone-500 leading-relaxed max-w-md">
                                Discover our curated collection of premium furniture — from minimal modern to timeless rustic.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href={route('shop.index')}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#6F4E37] text-white text-sm font-medium rounded-full hover:bg-[#5A3E2B] transition-colors"
                                >
                                    Explore Collection
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                                {!auth.user && (
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center px-6 py-3 border border-stone-200 text-stone-700 text-sm font-medium rounded-full hover:bg-stone-50 transition-colors"
                                    >
                                        Sign Up Free
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Right image */}
                        <div className="relative">
                            <div className="rounded-2xl overflow-hidden bg-stone-100 aspect-[4/3]">
                                <img
                                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&h=675&fit=crop&crop=center"
                                    alt="Featured furniture"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── CATEGORIES ─── */}
                <section className="border-t border-stone-100">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
                        <div className="flex items-end justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-semibold text-stone-900">
                                    Shop by Category
                                </h2>
                                <p className="text-sm text-stone-500 mt-1">
                                    Find the perfect piece for every room.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {categories.map(({ name, icon: Icon }) => (
                                <Link
                                    key={name}
                                    href={route('shop.index')}
                                    className="group flex flex-col items-center justify-center py-6 rounded-xl border border-stone-100 hover:border-[#6F4E37]/30 hover:bg-[#F5EDE8]/40 transition-colors"
                                >
                                    <Icon className="h-5 w-5 text-stone-400 group-hover:text-[#6F4E37] transition-colors" />
                                    <span className="mt-2.5 text-xs font-medium text-stone-600 group-hover:text-[#6F4E37] transition-colors">
                                        {name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── FEATURED PRODUCTS ─── */}
                <section className="border-t border-stone-100">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
                        <div className="flex items-end justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-semibold text-stone-900">
                                    Featured Products
                                </h2>
                                <p className="text-sm text-stone-500 mt-1">
                                    Handpicked pieces from our latest collection.
                                </p>
                            </div>
                            <Link
                                href={route('shop.index')}
                                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-[#6F4E37] hover:gap-2 transition-all"
                            >
                                View all
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    href={route('shop.index')}
                                    className="group block"
                                >
                                    <div className="rounded-xl overflow-hidden bg-stone-100 aspect-square">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                                            {product.category}
                                        </p>
                                        <h3 className="mt-1 text-sm font-medium text-stone-900 truncate">
                                            {product.name}
                                        </h3>
                                        <p className="mt-0.5 text-sm font-semibold text-[#6F4E37]">
                                            {product.price}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── CTA ─── */}
                <section className="border-t border-stone-100">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
                        <div className="rounded-2xl bg-[#6F4E37] px-8 py-14 text-center">
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                Ready to transform your space?
                            </h2>
                            <p className="mt-3 text-sm md:text-base text-stone-200 max-w-lg mx-auto">
                                Join thousands of happy customers and discover furniture that lasts a lifetime.
                            </p>
                            <div className="mt-7 flex flex-wrap justify-center gap-3">
                                <Link
                                    href={route('shop.index')}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#6F4E37] text-sm font-medium rounded-full hover:bg-stone-100 transition-colors"
                                >
                                    Browse Products
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                                {!auth.user && (
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center px-6 py-3 border border-white/30 text-white text-sm font-medium rounded-full hover:bg-white/10 transition-colors"
                                    >
                                        Create Account
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── FOOTER ─── */}
                <footer className="border-t border-stone-100">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
                            <p>© {new Date().getFullYear()} FMS — Furniture Management System</p>
                            <p>
                                Laravel v{laravelVersion} · PHP v{phpVersion}
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
