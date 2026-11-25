import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRightIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline';
import ProductCard from './ProductCard';

export default function Index({ products }) {
    const { flash } = usePage().props;
    const productCount = products.length;

    return (
        <GuestLayout>
            <Head title="Collection | FMS" />

            <div className="bg-[#F8F6F2] text-[#29251F]">
                {/* ── PAGE HEADER ── */}
                <section className="relative overflow-hidden border-b border-[#EAE5DC] bg-[#F1EDE6]">
                    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12 lg:py-20">
                        <div className="flex items-center gap-3">
                            <span className="h-px w-10 bg-[#9B7956]" />
                            <span className="text-[10px] font-semibold tracking-[0.35em] text-[#9B7956]">
                                THE COLLECTION
                            </span>
                        </div>

                        <div className="mt-7 grid gap-8 md:grid-cols-2 md:items-end">
                            <h1 className="font-serif text-5xl leading-[1.1] tracking-tight md:text-6xl">
                                Pieces crafted for
                                <br />
                                <span className="italic text-[#9B7956]">
                                    thoughtful living.
                                </span>
                            </h1>
                            <p className="max-w-md text-sm leading-7 text-[#81776D] md:justify-self-end">
                                Explore our handcrafted furniture collection — each
                                piece designed with intention and built to last.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-12 lg:py-16">
                    {/* ── FLASH MESSAGES ── */}
                    {(flash?.success || flash?.error) && (
                        <div className="mb-10 space-y-3">
                            {flash.success && (
                                <div
                                    role="status"
                                    className="flex items-start gap-3 border border-[#DCE5CF] bg-[#F4F8EE] px-4 py-3 text-sm text-[#4A6634]"
                                >
                                    <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#6B8A4A]" />
                                    <span className="font-medium">{flash.success}</span>
                                </div>
                            )}
                            {flash.error && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-3 border border-[#E5CFCF] bg-[#FCF3F3] px-4 py-3 text-sm text-[#8B3A3A]"
                                >
                                    <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#A85D5D]" />
                                    <span className="font-medium">{flash.error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TOOLBAR ── */}
                    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-[#EAE5DC] pb-6">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="h-px w-8 bg-[#9B7956]" />
                                <span className="text-[10px] font-semibold tracking-[0.3em] text-[#9B7956]">
                                    BROWSE ALL
                                </span>
                            </div>
                            <p className="mt-3 text-sm text-[#81776D]">
                                Showing{' '}
                                <span className="font-semibold text-[#29251F]">
                                    {productCount}
                                </span>{' '}
                                {productCount === 1 ? 'piece' : 'pieces'}
                            </p>
                        </div>

                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 border-b border-[#493729] pb-2 text-xs font-semibold tracking-widest hover:text-[#795A3F]"
                        >
                            BACK TO HOME <ArrowUpRightIcon className="h-4 w-4" />
                        </Link>
                    </div>

                    {/* ── PRODUCT GRID ── */}
                    {productCount > 0 ? (
                        <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 lg:gap-x-7 xl:grid-cols-4">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        /* ── EMPTY STATE ── */
                        <div className="flex flex-col items-center justify-center border border-dashed border-[#EAE5DC] bg-[#F1EDE6]/60 px-6 py-24 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F8F6F2] ring-1 ring-[#EAE5DC]">
                                <Squares2X2Icon className="h-7 w-7 text-[#9B8872]" />
                            </div>
                            <h2 className="mt-6 font-serif text-2xl">Nothing here yet</h2>
                            <p className="mt-3 max-w-sm text-sm leading-7 text-[#81776D]">
                                We're restocking the collection. Check back soon for
                                new handcrafted pieces.
                            </p>
                            <Link
                                href="/"
                                className="mt-8 inline-flex items-center gap-2 bg-[#493729] px-7 py-4 text-xs font-semibold tracking-widest text-white transition hover:bg-[#71543C]"
                            >
                                BACK TO HOME <ArrowUpRightIcon className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </GuestLayout>
    );
}
