import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    CheckCircleIcon,
    XMarkIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

export default function Show({ product }) {
    const { flash } = usePage().props;
    const [showToast, setShowToast] = useState(false);
    const [mode, setMode] = useState('standard');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [customizationData, setCustomizationData] = useState({});
    const [stepErrors, setStepErrors] = useState({});
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [selectedFinish, setSelectedFinish] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // ── Variant state ─────────────────────────────────────────
    const activeVariants = (product.variants || []).filter((v) => v.is_active);
    const [selectedVariantId, setSelectedVariantId] = useState(
        activeVariants[0]?.id ?? null
    );

    const selectedVariant =
        activeVariants.find((v) => v.id === selectedVariantId) ||
        activeVariants[0] ||
        null;

    // ✅ Treat "no variant" as Standard so variant-less products keep working
    const isStandardVariant =
        !selectedVariant || selectedVariant.slug === 'standard';

    const variantImages = selectedVariant?.images || [];
    const displayImages =
        variantImages.length > 0 ? variantImages : product.images || [];
    const primaryImage = displayImages[0] || null;

    const laborCost = Number(product.labor_cost || 0);
    const basePrice = selectedVariant
        ? Number(selectedVariant.price)
        : Number(product.price);
    const displayPrice = basePrice + laborCost;

    // ── Finishes only for the Standard variant ────────────────
    const hasFinishes = product.finishes && product.finishes.length > 0;
    const showFinishes = hasFinishes && isStandardVariant;
    // ──────────────────────────────────────────────────────────

    const { data, setData, post, processing, reset } = useForm({
        product_id: product.id,
        quantity: 1,
        customization: [],
        variant_id: activeVariants[0]?.id ?? null,
    });

    const parts = product.parts || [];
    // ✅ Customization is only available on the Standard variant
    const isCustomizable =
        product.is_customizable && parts.length > 0 && isStandardVariant;
    const totalParts = parts.length;
    const totalSteps = totalParts + 1;

    const stepContainerRef = useRef(null);

    // Keep form in sync with variant selection
    useEffect(() => {
        setData('variant_id', selectedVariantId);

        // Switching to Ordinary: clear finish + reset any customization state
        if (selectedVariant && selectedVariant.slug === 'ordinary') {
            setSelectedFinish(null);
            setCustomizationData({});
            setStepErrors({});
            setMode('standard');
            setIsModalOpen(false);
            setCurrentStep(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVariantId]);

    useEffect(() => {
        if (flash.success) {
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash.success]);

    const openModal = () => {
        // Safety guard — shouldn't happen because the button only renders on Standard
        if (!isStandardVariant) return;
        setMode('customize');
        setCurrentStep(0);
        setCustomizationData({});
        setStepErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setMode('standard');
        setCurrentStep(0);
        setCustomizationData({});
        setStepErrors({});
        reset();
    };

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isModalOpen) closeModal();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isModalOpen]);

    useEffect(() => {
        document.body.style.overflow = isModalOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isModalOpen]);

    const handleDimensionChange = (partId, field, value) => {
        setCustomizationData((prev) => ({
            ...prev,
            [partId]: { ...(prev[partId] || {}), [field]: value },
        }));
        if (stepErrors[partId]?.includes(field)) {
            setStepErrors((prev) => {
                const newErrors = { ...prev };
                newErrors[partId] = newErrors[partId].filter((f) => f !== field);
                if (newErrors[partId].length === 0) delete newErrors[partId];
                return newErrors;
            });
        }
    };

    const validateStep = (stepIndex) => {
        if (stepIndex >= totalParts) return true;
        const part = parts[stepIndex];
        const entered = customizationData[part.id] || {};
        const fields = part.dimension_fields || [];
        const missing = fields.filter((f) => !entered[f] || entered[f] === '');
        if (missing.length > 0) {
            setStepErrors((prev) => ({ ...prev, [part.id]: missing }));
            return false;
        }
        setStepErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[part.id];
            return newErrors;
        });
        return true;
    };

    const goToNext = () => {
        if (isTransitioning) return;
        if (currentStep < totalParts && !validateStep(currentStep)) {
            stepContainerRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
            return;
        }
        if (currentStep < totalSteps - 1) {
            setIsTransitioning(true);
            setCurrentStep((prev) => prev + 1);
            setTimeout(() => setIsTransitioning(false), 300);
        }
    };

    const goToPrevious = () => {
        if (isTransitioning) return;
        if (currentStep > 0) {
            setIsTransitioning(true);
            setCurrentStep((prev) => prev - 1);
            setTimeout(() => setIsTransitioning(false), 300);
        }
    };

    const isAllValid = () => {
        for (let i = 0; i < totalParts; i++) {
            const part = parts[i];
            const entered = customizationData[part.id] || {};
            const fields = part.dimension_fields || [];
            const missing = fields.filter((f) => !entered[f] || entered[f] === '');
            if (missing.length > 0) {
                setStepErrors((prev) => ({ ...prev, [part.id]: missing }));
                return false;
            }
        }
        return true;
    };

    const handleAddToCart = () => {
        // Validate customization only when we're actually in customize mode
        // AND the Standard variant is selected.
        if (mode === 'customize' && isStandardVariant) {
            let isValid = true;
            const allErrors = {};
            for (let i = 0; i < totalParts; i++) {
                const part = parts[i];
                const entered = customizationData[part.id] || {};
                const fields = part.dimension_fields || [];
                const missing = fields.filter(
                    (f) => !entered[f] || entered[f] === ''
                );
                if (missing.length > 0) {
                    allErrors[part.id] = missing;
                    isValid = false;
                }
            }
            if (!isValid) {
                setStepErrors(allErrors);
                const firstErrorPart = parts.findIndex((p) => allErrors[p.id]);
                if (firstErrorPart !== -1) {
                    setCurrentStep(firstErrorPart);
                    stepContainerRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                    });
                }
                return;
            }
        }

        let customization = {};

        // Finish only when Standard and it's actually shown
        if (showFinishes && selectedFinish) {
            customization.finish_id = selectedFinish;
        }

        // Include per-part customization ONLY when customizing on Standard
        if (mode === 'customize' && isStandardVariant) {
            customization = { ...customization, ...customizationData };
        }

        const finalCustomization =
            Object.keys(customization).length > 0 ? customization : [];

        setData({
            ...data,
            quantity,
            customization: finalCustomization,
            variant_id: selectedVariantId,
        });

        post(route('customer.cart.add'), {
            preserveScroll: true,
            onSuccess: () => {
                if (mode === 'customize') closeModal();
                setQuantity(1);
            },
            onError: (errors) => {
                console.error(errors);
                alert('Could not add to cart. Please try again.');
            },
        });
    };

    // ── Base dimensions helper (only fields with values) ──────
    const baseDimensions = [
        { label: 'Length',    value: product.standard_length },
        { label: 'Width',     value: product.standard_width },
        { label: 'Height',    value: product.standard_height },
        { label: 'Thickness', value: product.standard_thickness },
        { label: 'Diameter',  value: product.standard_diameter },
        { label: 'Depth',     value: product.standard_depth },
    ].filter(
        (d) => d.value !== null && d.value !== undefined && d.value !== ''
    );

    // ------- Modal Renderers -------
    const renderDimensionInputs = (part) => {
        const fields = part.dimension_fields || [];
        if (fields.length === 0) return null;

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                {fields.map((field) => {
                    const value = customizationData[part.id]?.[field] || '';
                    const hasError = stepErrors[part.id]?.includes(field);
                    return (
                        <div key={field} className="flex flex-col">
                            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2">
                                {field} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={value}
                                    onChange={(e) =>
                                        handleDimensionChange(
                                            part.id,
                                            field,
                                            e.target.value
                                        )
                                    }
                                    className={`block w-full rounded-xl border px-4 py-3 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-4 ${
                                        hasError
                                            ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10'
                                            : 'border-gray-200 bg-gray-50 focus:border-[#6F4E37] focus:bg-white focus:ring-[#6F4E37]/10'
                                    }`}
                                    placeholder="0.00"
                                />
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                                    in
                                </span>
                            </div>
                            {hasError && (
                                <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-red-500">
                                    <svg
                                        className="h-3 w-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    This field is required
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderWizardContent = () => {
        const isReviewStep = currentStep === totalParts;
        const currentPart = isReviewStep ? null : parts[currentStep];

        return (
            <div className="flex flex-col h-full">
                {/* ── Header ────────────────────────────────────── */}
                <div className="flex-shrink-0 px-6 sm:px-8 pt-6 pb-5 border-b border-gray-100">
                    <div className="pr-10">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6F4E37]">
                            {isReviewStep
                                ? 'Final Step'
                                : `Step ${currentStep + 1} of ${totalSteps}`}
                        </p>
                        <h2 className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                            {isReviewStep
                                ? 'Review your customization'
                                : 'Customize your piece'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {isReviewStep
                                ? 'Double-check your dimensions before adding to cart.'
                                : `Provide the measurements for each part of your ${product.name.toLowerCase()}.`}
                        </p>
                    </div>

                    {/* Segmented step progress */}
                    <div className="mt-5 flex items-center gap-1.5">
                        {parts.map((p, idx) => (
                            <div key={p.id} className="flex-1">
                                <div
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                        idx < currentStep
                                            ? 'bg-[#6F4E37]'
                                            : idx === currentStep
                                            ? 'bg-[#6F4E37]/50'
                                            : 'bg-gray-200'
                                    }`}
                                />
                            </div>
                        ))}
                        <div className="flex-1">
                            <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                    isReviewStep
                                        ? 'bg-[#6F4E37]/60'
                                        : 'bg-gray-200'
                                }`}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Body ──────────────────────────────────────── */}
                <div
                    ref={stepContainerRef}
                    className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6"
                >
                    <div
                        className="transition-all duration-300 ease-out"
                        style={{
                            transform: isTransitioning
                                ? 'translateX(-16px)'
                                : 'translateX(0)',
                            opacity: isTransitioning ? 0 : 1,
                        }}
                    >
                        {isReviewStep ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {parts.map((part) => {
                                        const entered =
                                            customizationData[part.id] || {};
                                        const fields =
                                            part.dimension_fields || [];
                                        const missingFields = fields.filter(
                                            (f) =>
                                                !entered[f] || entered[f] === ''
                                        );
                                        const hasMissing =
                                            missingFields.length > 0;

                                        if (hasMissing) {
                                            return (
                                                <div
                                                    key={part.id}
                                                    className="rounded-2xl border border-red-200 bg-red-50/70 p-4"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold text-red-800">
                                                            {part.name}
                                                        </p>
                                                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                                                            !
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-red-600">
                                                        Missing:{' '}
                                                        {missingFields.join(
                                                            ', '
                                                        )}
                                                    </p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={part.id}
                                                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {part.reference_image ? (
                                                        <img
                                                            src={
                                                                part.reference_image
                                                            }
                                                            alt={part.name}
                                                            className="h-14 w-14 flex-shrink-0 rounded-xl border border-gray-100 object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-gray-400">
                                                            {part.name.charAt(
                                                                0
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="truncate text-sm font-semibold text-gray-900">
                                                            {part.name}
                                                        </h4>
                                                        <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
                                                            {fields.map((f) => (
                                                                <div
                                                                    key={f}
                                                                    className="flex items-baseline justify-between gap-1 text-xs"
                                                                >
                                                                    <span className="capitalize text-gray-500">
                                                                        {f}:
                                                                    </span>
                                                                    <span className="font-semibold text-gray-900">
                                                                        {entered[
                                                                            f
                                                                        ] || '-'}
                                                                        "
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {!isAllValid() && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                                        Some dimensions are still missing. Use
                                        “Previous” to go back and complete
                                        them.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                                {/* Image column */}
                                <div className="md:w-2/5 flex-shrink-0">
                                    <div className="aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                                        {currentPart.reference_image ? (
                                            <img
                                                src={
                                                    currentPart.reference_image
                                                }
                                                alt={currentPart.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    {totalParts > 1 && (
                                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                                            {parts.map((p, idx) => (
                                                <div
                                                    key={p.id}
                                                    className={`h-10 w-10 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                                                        idx === currentStep
                                                            ? 'border-[#6F4E37] shadow-sm'
                                                            : 'border-transparent opacity-50 hover:opacity-100'
                                                    }`}
                                                >
                                                    {p.reference_image ? (
                                                        <img
                                                            src={
                                                                p.reference_image
                                                            }
                                                            alt={p.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[10px] font-semibold text-gray-500">
                                                            {p.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Input column */}
                                <div className="min-w-0 flex-1">
                                    <span className="inline-flex items-center rounded-full bg-[#6F4E37]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6F4E37]">
                                        Part {currentStep + 1} of {totalParts}
                                    </span>
                                    <h3 className="mt-2 text-xl font-bold text-gray-900">
                                        {currentPart.name}
                                    </h3>
                                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                                        Enter the dimensions for this part. All
                                        fields are required.
                                    </p>

                                    {/* ─── Standard Dimensions Reference ─── */}
                                    {(() => {
                                        const standardFields = (currentPart.dimension_fields || [])
                                            .map((field) => {
                                                const key = `standard_${field.toLowerCase()}`;
                                                const raw = currentPart[key];
                                                if (raw === null || raw === undefined || raw === '') return null;
                                                return { field, value: Number(raw) };
                                            })
                                            .filter(Boolean);

                                        if (standardFields.length === 0) return null;

                                        return (
                                            <div className="mt-4 rounded-xl border border-[#6F4E37]/15 bg-[#F5EDE8]/40 px-4 py-3">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6F4E37] mb-2">
                                                    Standard Reference
                                                </p>
                                                <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                                                    {standardFields.map(({ field, value }) => (
                                                        <div
                                                            key={field}
                                                            className="flex items-baseline gap-1.5"
                                                        >
                                                            <span className="text-xs text-gray-500 capitalize">
                                                                {field}:
                                                            </span>
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {value}"
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
                                                    Enter these values to keep the base price.
                                                    Larger sizes may add a small surcharge.
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    {renderDimensionInputs(currentPart)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Footer ────────────────────────────────────── */}
                <div className="flex-shrink-0 flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-6 sm:px-8 py-4">
                    <button
                        onClick={goToPrevious}
                        disabled={currentStep === 0 || isTransitioning}
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                        Previous
                    </button>

                    {isReviewStep ? (
                        <button
                            onClick={handleAddToCart}
                            disabled={processing || !isAllValid()}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#6F4E37] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#5A3E2B] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? 'Adding...' : 'Add to Cart'}
                            <CheckCircleIcon className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={goToNext}
                            disabled={isTransitioning}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#6F4E37] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#5A3E2B] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {currentStep === totalParts - 1
                                ? 'Review'
                                : 'Next'}
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <GuestLayout>
            <Head title={product.name} />

            {showToast && flash.success && (
                <div className="fixed top-4 right-4 z-50 max-w-sm bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium flex-1">
                        {flash.success}
                    </span>
                    <button
                        onClick={() => setShowToast(false)}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
                        <div className="p-6 sm:p-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* ─── Left – Images ─── */}
                                <div>
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                        {primaryImage ? (
                                            <img
                                                src={`/storage/${primaryImage.path}`}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    {displayImages.length > 1 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                            {displayImages.slice(1).map((img) => (
                                                <img
                                                    key={img.id}
                                                    src={`/storage/${img.path}`}
                                                    alt=""
                                                    className="h-20 w-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ─── Right – Details ─── */}
                                <div className="flex flex-col">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                        {product.name}
                                    </h1>

                                    <div className="mt-2 flex items-baseline gap-3">
                                        <span className="text-2xl font-bold text-[#6F4E37]">
                                            ₱{displayPrice.toFixed(2)}
                                        </span>
                                        {selectedVariant && (
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                {selectedVariant.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* ── Variant selector ─────────────────── */}
                                    {activeVariants.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                                Choose a Variant
                                            </h3>
                                            <div className="mt-3 grid grid-cols-2 gap-3">
                                                {activeVariants.map((variant) => {
                                                    const isSelected =
                                                        variant.id === selectedVariantId;
                                                    const variantImage =
                                                        variant.images?.[0] || null;
                                                    return (
                                                        <button
                                                            key={variant.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedVariantId(
                                                                    variant.id
                                                                )
                                                            }
                                                            className={`text-left rounded-xl border-2 overflow-hidden transition-all ${
                                                                isSelected
                                                                    ? 'border-[#6F4E37] shadow-md bg-[#F5EDE8]/40'
                                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                            }`}
                                                        >
                                                            <div className="aspect-video bg-gray-100 overflow-hidden">
                                                                {variantImage ? (
                                                                    <img
                                                                        src={`/storage/${variantImage.path}`}
                                                                        alt={variant.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                                        No image
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="p-2.5">
                                                                <div className="flex items-center justify-between">
                                                                    <span
                                                                        className={`text-xs font-semibold uppercase tracking-wide ${
                                                                            isSelected
                                                                                ? 'text-[#6F4E37]'
                                                                                : 'text-gray-700'
                                                                        }`}
                                                                    >
                                                                        {variant.name}
                                                                    </span>
                                                                    <span
                                                                        className={`text-sm font-bold ${
                                                                            isSelected
                                                                                ? 'text-[#6F4E37]'
                                                                                : 'text-gray-900'
                                                                        }`}
                                                                    >
                                                                        ₱{(Number(variant.price) + Number(product.labor_cost || 0)).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                                {variant.description && (
                                                                    <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-2">
                                                                        {variant.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                        <span className="text-sm text-gray-500">
                                            Category: {product.category?.name}
                                        </span>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                product.stock_quantity > 0
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            Stock: {product.stock_quantity}
                                        </span>
                                    </div>

                                    <p className="mt-4 text-gray-600 leading-relaxed">
                                        {product.description}
                                    </p>

                                    {/* ── Base Dimensions ──────────── */}
                                    {baseDimensions.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                                Base Dimensions
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Standard measurements covered by the
                                                base price. Larger sizes may incur a
                                                customization surcharge.
                                            </p>
                                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {baseDimensions.map((d) => (
                                                    <div
                                                        key={d.label}
                                                        className="bg-gray-50 rounded-lg px-3 py-2"
                                                    >
                                                        <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                                            {d.label}
                                                        </p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {d.value}"
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Finish Selection — only for Standard, optional */}
                                    {showFinishes && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex items-baseline justify-between">
                                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                                    Select Finish
                                                </h3>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                                                    Optional
                                                </span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {product.finishes.map((finish) => (
                                                    <button
                                                        key={finish.id}
                                                        onClick={() =>
                                                            setSelectedFinish(
                                                                selectedFinish ===
                                                                    finish.id
                                                                    ? null
                                                                    : finish.id
                                                            )
                                                        }
                                                        className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                                                            selectedFinish ===
                                                            finish.id
                                                                ? 'border-[#6F4E37] bg-[#6F4E37] text-white'
                                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {finish.name}
                                                    </button>
                                                ))}
                                            </div>
                                            {selectedFinish && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedFinish(null)
                                                    }
                                                    className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
                                                >
                                                    Clear selection
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Quantity Selector */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <label
                                                htmlFor="quantity"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Quantity:
                                            </label>
                                            <input
                                                type="number"
                                                id="quantity"
                                                min="1"
                                                max={product.stock_quantity || 99}
                                                value={quantity}
                                                onChange={(e) =>
                                                    setQuantity(
                                                        Math.max(
                                                            1,
                                                            parseInt(e.target.value) || 1
                                                        )
                                                    )
                                                }
                                                className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-center focus:ring-1 focus:ring-[#6F4E37] focus:border-[#6F4E37]"
                                            />
                                            <span className="text-xs text-gray-500">
                                                (max {product.stock_quantity})
                                            </span>
                                        </div>
                                    </div>

                                    {/* Customization / Add to Cart
                                        Ordinary variant → plain Add to Cart
                                        Standard variant + customizable → Buy + Customize */}
                                    {isCustomizable ? (
                                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                                Choose your experience
                                            </h3>

                                            <button
                                                onClick={handleAddToCart}
                                                disabled={
                                                    processing ||
                                                    product.stock_quantity < 1
                                                }
                                                className="w-full inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {product.stock_quantity < 1
                                                    ? 'Out of Stock'
                                                    : `Buy ${selectedVariant?.name || 'Standard'}`}
                                            </button>

                                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#6F4E37]/5 to-[#6F4E37]/10 border border-[#6F4E37]/20 p-5 transition-all hover:shadow-md hover:border-[#6F4E37]/40 group">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-[#6F4E37]/10 rounded-lg group-hover:bg-[#6F4E37]/20 transition-colors">
                                                        <SparklesIcon className="h-5 w-5 text-[#6F4E37]" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-base font-semibold text-gray-900">
                                                            Would you like to customize
                                                            your furniture?
                                                        </h4>
                                                        <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                                                            Make it truly yours by
                                                            customizing the dimensions of
                                                            each furniture part to match
                                                            your exact needs and
                                                            preferences.
                                                        </p>
                                                        <button
                                                            onClick={openModal}
                                                            className="mt-3 inline-flex items-center px-5 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-all shadow-sm group-hover:shadow-md"
                                                        >
                                                            Start Customizing
                                                            <ChevronRightIcon className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#6F4E37]/5 rounded-full blur-2xl group-hover:bg-[#6F4E37]/10 transition-all" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={handleAddToCart}
                                                disabled={
                                                    processing ||
                                                    product.stock_quantity < 1
                                                }
                                                className={`w-full inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                                                    product.stock_quantity < 1
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        : 'bg-[#6F4E37] text-white hover:bg-[#5A3E2B] focus:ring-2 focus:ring-[#6F4E37]/40'
                                                }`}
                                            >
                                                {product.stock_quantity < 1
                                                    ? 'Out of Stock'
                                                    : processing
                                                    ? 'Adding...'
                                                    : selectedVariant
                                                    ? `Add ${selectedVariant.name} to Cart`
                                                    : 'Add to Cart'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Customization Modal ───────────────────────────── */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
                    onClick={closeModal}
                >
                    <div
                        className="relative flex h-[85vh] max-h-[720px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl animate-fade-in-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeModal}
                            aria-label="Close"
                            className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-900"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>

                        <div className="flex min-h-0 flex-1 flex-col">
                            {renderWizardContent()}
                        </div>
                    </div>
                </div>
            )}
        </GuestLayout>
    );
}
