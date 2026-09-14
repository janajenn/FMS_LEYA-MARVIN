import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    UsersIcon,
    RectangleStackIcon,
    ArchiveBoxIcon,
    LightBulbIcon,
    PaintBrushIcon,
    SunIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    // Sample featured products – replace with real data later
    const featuredProducts = [
        {
            id: 1,
            name: 'Nordic Lounge Chair',
            price: '$249',
            image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=300&fit=crop&crop=center',
            category: 'Seating',
        },
        {
            id: 2,
            name: 'Rustic Oak Table',
            price: '$599',
            image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=400&h=300&fit=crop&crop=center',
            category: 'Tables',
        },
        {
            id: 3,
            name: 'Modern Bookshelf',
            price: '$379',
            image: 'https://images.unsplash.com/photo-1597019558926-4f8604b34a2f?w=400&h=300&fit=crop&crop=center',
            category: 'Storage',
        },
        {
            id: 4,
            name: 'Velvet Ottoman',
            price: '$189',
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&crop=center',
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
            <div className="min-h-screen bg-gray-50">
                {/* Custom CSS for modern animations */}
                <style>{`
                    @keyframes fadeUp {
                        0% { opacity: 0; transform: translateY(20px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                    }
                    .animate-fade-up { animation: fadeUp 0.7s ease-out forwards; }
                    .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
                    .animate-float { animation: float 4s ease-in-out infinite; }
                    .delay-100 { animation-delay: 0.1s; }
                    .delay-200 { animation-delay: 0.2s; }
                    .delay-300 { animation-delay: 0.3s; }
                    .glass-card {
                        background: rgba(255,255,255,0.8);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(255,255,255,0.4);
                    }
                    .hover-lift {
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .hover-lift:hover {
                        transform: translateY(-8px) scale(1.02);
                        box-shadow: 0 20px 40px -12px rgba(0,0,0,0.2);
                    }
                    .image-zoom {
                        overflow: hidden;
                    }
                    .image-zoom img {
                        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .image-zoom:hover img {
                        transform: scale(1.08);
                    }
                    .hero-overlay {
                        background: linear-gradient(135deg, rgba(111,78,55,0.85) 0%, rgba(139,107,79,0.6) 100%);
                    }
                    .section-curve {
                        border-radius: 0 0 50% 50% / 0 0 20% 20%;
                    }
                `}</style>

                {/* Header – clean and minimal with blur */}
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/60 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-2">
                                <ApplicationLogo className="h-10 w-auto fill-current text-gray-800" />
                                <span className="font-bold text-2xl text-gray-900 tracking-tight">FMS</span>
                            </div>
                            <nav className="flex items-center space-x-6">
                                {auth.user ? (
                                    <>
                                        <Link
                                            href={route('dashboard')}
                                            className="text-sm font-medium text-gray-600 hover:text-[#6F4E37] transition-colors"
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            href={route('shop.index')}
                                            className="text-sm font-medium text-gray-600 hover:text-[#6F4E37] transition-colors"
                                        >
                                            Shop
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
                                            className="inline-flex items-center px-4 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-full hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm hover:shadow-md"
                                        >
                                            Get Started
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Hero – split layout with modern curves */}
                <section className="relative overflow-hidden bg-[#6F4E37] text-white">
                    {/* Background shape */}
                    <div className="absolute inset-0">
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#F5EDE8]/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#F5EDE8]/10 rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 items-center py-20 lg:py-28">
                            {/* Left content */}
                            <div className="space-y-6">
                                <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium bg-white/20 text-white rounded-full backdrop-blur-sm">
                                    <SparklesIcon className="h-4 w-4" />
                                    New Collection 2026
                                </span>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight animate-fade-up">
                                    Crafted for <span className="text-[#F5EDE8]">Comfort</span>, Built to Last
                                </h1>
                                <p className="text-lg md:text-xl text-gray-100 leading-relaxed animate-fade-up delay-100">
                                    Discover our curated collection of premium furniture – from minimalist modern to timeless rustic. Elevate your space today.
                                </p>
                                <div className="flex flex-wrap gap-4 animate-fade-up delay-200">
                                    <Link
                                        href={route('shop.index')}
                                        className="inline-flex items-center px-6 py-3 bg-white text-[#6F4E37] font-medium rounded-full shadow-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-xl"
                                    >
                                        Explore Collection
                                        <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center px-6 py-3 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-colors duration-200"
                                    >
                                        Sign Up Free
                                    </Link>
                                </div>
                            </div>
                            {/* Right image */}
                            <div className="relative lg:block hidden">
                                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                    <img
                                        src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop&crop=center"
                                        alt="Furniture"
                                        className="w-full h-[400px] object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#6F4E37]/30 to-transparent"></div>
                                </div>
                                {/* Floating badge */}
                                <div className="absolute -bottom-4 -right-4 glass-card rounded-xl px-4 py-3 shadow-lg">
                                    <p className="text-xs text-gray-600">⭐ 4.9/5</p>
                                    <p className="text-sm font-semibold text-gray-800">Trusted by 2,000+</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Curved bottom */}
                    <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 40L60 50C120 60 240 80 360 80C480 80 600 60 720 40C840 20 960 20 1080 30C1200 40 1320 60 1380 70L1440 80V80H0V40Z" fill="#F9FAFB"/>
                        </svg>
                    </div>
                </section>

                {/* Categories – clean, modern grid */}
                <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Shop by Category</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {categories.map(({ name, icon: Icon }) => (
                                <Link
                                    key={name}
                                    href={route('shop.index')}
                                    className="group flex flex-col items-center p-6 rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-200 hover-lift"
                                >
                                    <div className="p-3 rounded-full bg-[#F5EDE8] group-hover:bg-[#6F4E37] transition-colors duration-200">
                                        <Icon className="h-6 w-6 text-[#6F4E37] group-hover:text-white transition-colors duration-200" />
                                    </div>
                                    <span className="mt-3 text-sm font-medium text-gray-700 group-hover:text-[#6F4E37]">
                                        {name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Featured Products – elevated cards */}
                <section id="products" className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
                            <Link
                                href={route('shop.index')}
                                className="text-sm font-medium text-[#6F4E37] hover:underline"
                            >
                                View All →
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 hover-lift overflow-hidden group"
                                >
                                    <div className="image-zoom aspect-[4/3] relative">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-3 left-3 bg-[#6F4E37]/80 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                                            {product.category}
                                        </div>
                                        <button className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] py-2 bg-white/90 backdrop-blur-sm text-[#6F4E37] text-sm font-medium rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#6F4E37] hover:text-white">
                                            Quick View
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                                            {product.name}
                                        </h3>
                                        <p className="mt-1 text-lg font-bold text-[#6F4E37]">
                                            {product.price}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Trust / CTA – bold and inviting */}
                <section className="py-20 bg-[#6F4E37] text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <img
                            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&h=400&fit=crop&crop=center"
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-bold tracking-tight">
                            Ready to Transform Your Space?
                        </h2>
                        <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto">
                            Join thousands of happy customers. Start browsing our full collection and find the perfect pieces for your home.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            <Link
                                href={route('register')}
                                className="inline-flex items-center px-6 py-3 bg-white text-[#6F4E37] font-medium rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200 hover:shadow-xl"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                href={route('shop.index')}
                                className="inline-flex items-center px-6 py-3 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-colors duration-200"
                            >
                                Browse Products
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 bg-gray-50 border-t border-gray-200/60">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
                            <p>© {new Date().getFullYear()} FMS – Furniture Management System</p>
                            <p className="mt-2 sm:mt-0 text-xs text-gray-400">
                                Laravel v{laravelVersion} (PHP v{phpVersion})
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
