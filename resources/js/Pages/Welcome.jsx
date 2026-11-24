
import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    ArrowUpRightIcon,
    ArrowRightIcon,
    SparklesIcon,
    CubeIcon,
    TruckIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    const products = [
        {
            name: 'Nordic Lounge Chair',
            category: 'SEATING',
            price: '₱249',
            image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
        },
        {
            name: 'Rustic Oak Table',
            category: 'TABLES',
            price: '₱599',
            image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800',
        },
        {
            name: 'Modern Bookshelf',
            category: 'STORAGE',
            price: '₱379',
            image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800',
        },
        {
            name: 'Velvet Lounge',
            category: 'LIVING',
            price: '₱189',
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        },
    ];

    const categories = [
        { name: 'Living Room', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600' },
        { name: 'Dining', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600' },
        { name: 'Bedroom', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600' },
        { name: 'Storage', image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600' },
    ];

    return (
        <>
            <Head title="FMS | Crafted Living" />

            <div className="min-h-screen bg-[#F8F6F2] text-[#29251F]">

                {/* NAVIGATION */}
                <header className="sticky top-0 z-50 border-b border-[#EAE5DC] bg-[#F8F6F2]/95 backdrop-blur-xl">
                    <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-6 lg:px-12">

                        <Link href="/" className="flex items-center gap-3">
                            <ApplicationLogo className="h-9 w-auto" />
                            <div>
                                <span className="block text-lg font-semibold tracking-[0.15em]">
                                    FMS
                                </span>
                                <span className="block text-[9px] tracking-[0.25em] text-[#9B8872]">
                                    FURNITURE STUDIO
                                </span>
                            </div>
                        </Link>

                        <nav className="hidden items-center gap-10 md:flex">
                            <Link href="/" className="text-xs font-medium tracking-widest hover:text-[#927253]">
                                HOME
                            </Link>
                            <Link href={route('shop.index')} className="text-xs font-medium tracking-widest hover:text-[#927253]">
                                COLLECTION
                            </Link>
                            <a href="#categories" className="text-xs font-medium tracking-widest hover:text-[#927253]">
                                CATEGORIES
                            </a>
                            <a href="#about" className="text-xs font-medium tracking-widest hover:text-[#927253]">
                                ABOUT
                            </a>
                        </nav>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <>
                                    <Link href={route('dashboard')} className="hidden text-sm font-medium sm:block">
                                        Dashboard
                                    </Link>
                                    <Link href={route('shop.index')}
                                        className="rounded-full bg-[#493729] px-5 py-3 text-xs font-semibold tracking-wide text-white transition hover:bg-[#71543C]">
                                        Shop Now <ArrowUpRightIcon className="ml-1 inline h-4 w-4" />
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href={route('login')}
                                        className="hidden text-sm font-medium sm:block hover:text-[#927253]">
                                        Log in
                                    </Link>
                                    <Link href={route('register')}
                                        className="rounded-full bg-[#493729] px-5 py-3 text-xs font-semibold tracking-wide text-white transition hover:bg-[#71543C]">
                                        Get Started <ArrowUpRightIcon className="ml-1 inline h-4 w-4" />
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* HERO */}
                <section className="mx-auto max-w-[1400px] px-5 pb-20 pt-8 lg:px-12 lg:pt-12">
                    <div className="relative min-h-[540px] overflow-hidden rounded-[4px] bg-[#45372C] lg:min-h-[650px]">

                        <img
                            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1800"
                            alt="Luxury furniture interior"
                            className="absolute inset-0 h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 bg-gradient-to-r from-[#211B16]/85 via-[#211B16]/55 to-transparent" />

                        <div className="relative flex min-h-[540px] max-w-2xl flex-col justify-center px-8 py-16 text-white lg:min-h-[650px] lg:px-20">

                            <div className="mb-7 flex items-center gap-3">
                                <span className="h-px w-10 bg-[#D4B48A]" />
                                <span className="text-[10px] font-semibold tracking-[0.35em] text-[#E3C9A8]">
                                    THE ART OF FINE LIVING
                                </span>
                            </div>

                            <h1 className="font-serif text-5xl leading-[1.12] tracking-tight md:text-6xl lg:text-7xl">
                                Furniture that
                                <br />
                                <span className="italic text-[#D9B991]">feels like</span>
                                <br />
                                home.
                            </h1>

                            <p className="mt-7 max-w-md text-sm leading-7 text-white/75 md:text-base">
                                Thoughtfully crafted furniture, timeless designs,
                                and personalized creations made to complement
                                the way you live.
                            </p>

                            <div className="mt-10 flex flex-wrap gap-4">
                                <Link href={route('shop.index')}
                                    className="inline-flex items-center gap-3 bg-[#D4B48A] px-7 py-4 text-xs font-semibold tracking-wider text-[#30251D] transition hover:bg-white">
                                    EXPLORE COLLECTION
                                    <ArrowUpRightIcon className="h-4 w-4" />
                                </Link>

                                <Link href={route('shop.index')}
                                    className="inline-flex items-center gap-2 border border-white/50 px-7 py-4 text-xs font-semibold tracking-wider text-white transition hover:bg-white hover:text-[#30251D]">
                                    DISCOVER MORE
                                </Link>
                            </div>
                        </div>

                        <div className="absolute bottom-8 right-8 hidden items-center gap-4 text-white/80 md:flex">
                            <span className="text-[10px] tracking-[0.3em]">EST. QUALITY & CRAFTSMANSHIP</span>
                            <span className="h-px w-14 bg-white/60" />
                        </div>
                    </div>
                </section>

                {/* INTRODUCTION */}
                <section id="about" className="mx-auto max-w-[1400px] px-6 py-20 lg:px-12">
                    <div className="grid gap-12 md:grid-cols-2 md:items-center">
                        <div>
                            <span className="text-[10px] font-semibold tracking-[0.3em] text-[#9B7956]">
                                OUR PHILOSOPHY
                            </span>
                            <h2 className="mt-5 font-serif text-4xl leading-tight md:text-5xl">
                                Designed with purpose.
                                <br />
                                <span className="italic text-[#9B7956]">Made for life.</span>
                            </h2>
                        </div>

                        <div>
                            <p className="max-w-lg text-sm leading-8 text-[#81776D]">
                                We believe every piece of furniture should have a
                                purpose, a personality, and a place in your home.
                                Discover carefully crafted pieces or customize
                                your own furniture to match your vision.
                            </p>
                            <Link href={route('shop.index')}
                                className="mt-6 inline-flex items-center gap-2 border-b border-[#493729] pb-2 text-xs font-semibold tracking-widest">
                                EXPLORE OUR STORY <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* CATEGORIES */}
                <section id="categories" className="border-y border-[#EAE5DC] bg-[#F1EDE6] py-20">
                    <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
                        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
                            <div>
                                <span className="text-[10px] font-semibold tracking-[0.3em] text-[#9B7956]">
                                    FIND YOUR STYLE
                                </span>
                                <h2 className="mt-3 font-serif text-4xl">Explore Collections</h2>
                            </div>
                            <Link href={route('shop.index')}
                                className="text-xs font-semibold tracking-widest text-[#795A3F]">
                                VIEW ALL COLLECTIONS →
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            {categories.map((category) => (
                                <Link key={category.name} href={route('shop.index')} className="group relative h-64 overflow-hidden bg-[#D8D0C4] md:h-80">
                                    <img src={category.image} alt={category.name}
                                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                                    <div className="absolute bottom-6 left-6 flex items-center justify-between right-5 text-white">
                                        <span className="font-serif text-xl md:text-2xl">{category.name}</span>
                                        <ArrowUpRightIcon className="h-5 w-5 transition group-hover:-translate-y-1 group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FEATURED PRODUCTS */}
                <section className="mx-auto max-w-[1400px] px-6 py-24 lg:px-12">
                    <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
                        <div>
                            <span className="text-[10px] font-semibold tracking-[0.3em] text-[#9B7956]">
                                SELECTED FOR YOU
                            </span>
                            <h2 className="mt-3 font-serif text-4xl md:text-5xl">
                                Featured Pieces
                            </h2>
                            <p className="mt-3 text-sm text-[#81776D]">
                                A collection of pieces worth coming home to.
                            </p>
                        </div>

                        <Link href={route('shop.index')}
                            className="inline-flex items-center gap-2 border-b border-[#493729] pb-2 text-xs font-semibold tracking-widest">
                            VIEW ALL PRODUCTS <ArrowUpRightIcon className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-7">
                        {products.map((product, index) => (
                            <Link key={product.name} href={route('shop.index')} className="group">
                                <div className="relative aspect-[4/5] overflow-hidden bg-[#EAE5DC]">
                                    <img src={product.image} alt={product.name}
                                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                                    <span className="absolute left-3 top-3 bg-[#F8F6F2] px-3 py-2 text-[9px] font-semibold tracking-widest text-[#493729]">
                                        FEATURED
                                    </span>
                                    <div className="absolute bottom-4 right-4 flex h-10 w-10 translate-y-3 items-center justify-center rounded-full bg-[#F8F6F2] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                        <ArrowUpRightIcon className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="mt-5 flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[9px] font-semibold tracking-[0.2em] text-[#9B8872]">
                                            {product.category}
                                        </p>
                                        <h3 className="mt-2 font-serif text-lg md:text-xl">
                                            {product.name}
                                        </h3>
                                    </div>
                                    <span className="text-sm font-semibold text-[#795A3F]">
                                        {product.price}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* CUSTOMIZATION BANNER */}
                <section className="mx-5 mb-20 lg:mx-12">
                    <div className="relative overflow-hidden bg-[#493729]">
                        <div className="grid md:grid-cols-2">
                            <div className="flex flex-col justify-center px-8 py-16 text-white lg:px-20 lg:py-24">
                                <div className="flex items-center gap-2 text-[#D4B48A]">
                                    <SparklesIcon className="h-5 w-5" />
                                    <span className="text-[10px] font-semibold tracking-[0.3em]">
                                        MADE YOUR WAY
                                    </span>
                                </div>

                                <h2 className="mt-6 font-serif text-4xl leading-tight md:text-5xl">
                                    Your vision.
                                    <br />
                                    <span className="italic text-[#D4B48A]">Your furniture.</span>
                                </h2>

                                <p className="mt-6 max-w-md text-sm leading-7 text-white/65">
                                    Create furniture that reflects your style.
                                    Choose your materials, dimensions, finishes,
                                    and designs to make every piece uniquely yours.
                                </p>

                                <Link href={route('shop.index')}
                                    className="mt-9 inline-flex w-fit items-center gap-3 bg-[#D4B48A] px-7 py-4 text-xs font-semibold tracking-widest text-[#30251D] transition hover:bg-white">
                                    START CUSTOMIZING <ArrowUpRightIcon className="h-4 w-4" />
                                </Link>
                            </div>

                            <div className="min-h-[300px]">
                                <img
                                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1100"
                                    alt="Custom furniture interior"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* BENEFITS */}
                <section className="border-y border-[#EAE5DC] py-16">
                    <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-6 sm:grid-cols-3 lg:px-12">
                        {[
                            { icon: CubeIcon, title: 'Thoughtful Craftsmanship', text: 'Designed with attention to every detail.' },
                            { icon: ShieldCheckIcon, title: 'Quality Materials', text: 'Materials selected for lasting value.' },
                            { icon: TruckIcon, title: 'Convenient Delivery', text: 'A seamless ordering and delivery experience.' },
                        ].map(({ icon: Icon, title, text }) => (
                            <div key={title} className="flex items-start gap-5">
                                <Icon className="h-8 w-8 shrink-0 text-[#9B7956]" />
                                <div>
                                    <h3 className="font-serif text-lg">{title}</h3>
                                    <p className="mt-2 text-xs leading-6 text-[#81776D]">{text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className="px-6 py-24 text-center">
                    <span className="text-[10px] font-semibold tracking-[0.3em] text-[#9B7956]">
                        MAKE YOUR SPACE YOUR OWN
                    </span>
                    <h2 className="mx-auto mt-5 max-w-2xl font-serif text-4xl leading-tight md:text-5xl">
                        Find the piece that makes it feel like home.
                    </h2>
                    <Link href={route('shop.index')}
                        className="mt-9 inline-flex items-center gap-3 bg-[#493729] px-9 py-4 text-xs font-semibold tracking-widest text-white transition hover:bg-[#795A3F]">
                        EXPLORE THE COLLECTION <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                </section>

                {/* FOOTER */}
                <footer className="bg-[#29231D] px-6 py-12 text-white lg:px-12">
                    <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-10 md:flex-row">
                        <div>
                            <div className="flex items-center gap-3">
                                <ApplicationLogo className="h-9 w-auto" />
                                <span className="text-lg font-semibold tracking-[0.15em]">FMS</span>
                            </div>
                            <p className="mt-4 max-w-xs text-xs leading-6 text-white/50">
                                Thoughtfully crafted furniture for spaces that tell your story.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-12">
                            <div>
                                <h4 className="text-[10px] font-semibold tracking-[0.2em] text-[#D4B48A]">EXPLORE</h4>
                                <Link href={route('shop.index')} className="mt-5 block text-xs text-white/65 hover:text-white">
                                    Shop Collection
                                </Link>
                                <Link href={route('login')} className="mt-3 block text-xs text-white/65 hover:text-white">
                                    Account Login
                                </Link>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-semibold tracking-[0.2em] text-[#D4B48A]">SYSTEM</h4>
                                <p className="mt-5 text-xs text-white/65">Furniture Management System</p>
                                <p className="mt-3 text-xs text-white/40">
                                    Laravel v{laravelVersion} · PHP v{phpVersion}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mx-auto mt-12 max-w-[1400px] border-t border-white/10 pt-6 text-center text-[10px] tracking-wider text-white/35 md:text-left">
                        © {new Date().getFullYear()} FMS. ALL RIGHTS RESERVED.
                    </div>
                </footer>
            </div>
        </>
    );
}
