import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    CheckCircleIcon,
    XMarkIcon,
    SparklesIcon,
    PaintBrushIcon,
    ArrowsPointingOutIcon,
    ArrowLeftIcon,
    CubeIcon,
} from '@heroicons/react/24/outline';

/* ══════════════════════════════════════════════════════════════
 *  OPTIMIZED SUB-COMPONENTS
 * ══════════════════════════════════════════════════════════════ */

const MainProductImage = memo(({ src, alt, fallbackSrc }) => {
    const imageSrc = src || fallbackSrc;
    if (!imageSrc) {
        return <div className="w-full h-full flex items-center justify-center text-stone-400 font-medium">No Image Available</div>;
    }
    return (
        <img
            src={imageSrc}
            alt={alt}
            className="max-h-full max-w-full object-contain drop-shadow-xl transition-transform duration-500 hover:scale-[1.02]"
        />
    );
});

const DesignGallery = memo(({ designs, selectedId, onSelect }) => {
    if (!designs || designs.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <PaintBrushIcon className="h-5 w-5 text-[#6F4E37]" />
                <h4 className="text-sm font-semibold text-gray-900">1. Select a Design</h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {designs.map((design) => {
                    const isSelected = selectedId === design.id;
                    const cost = Number(design.additional_cost || 0);

                    return (
                        <button
                            key={design.id}
                            onClick={() => onSelect(design.id)}
                            className={`relative text-left rounded-xl overflow-hidden border-2 transition-all ${
                                isSelected ? 'border-[#6F4E37] shadow-md ring-2 ring-[#6F4E37]/20' : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="aspect-[4/3] bg-gray-100 relative">
                                {design.image_path ? (
                                    <img src={`/storage/${design.image_path}`} alt={design.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                                )}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 bg-white rounded-full shadow-sm">
                                        <CheckCircleIcon className="h-5 w-5 text-[#6F4E37]" />
                                    </div>
                                )}
                            </div>
                            <div className="p-2.5 bg-white">
                                <p className="text-xs font-bold text-gray-900 truncate">{design.name}</p>
                                <div className="mt-1 flex items-center justify-between">
                                    <span className="text-[10px] text-gray-500">{design.is_default ? 'Standard' : 'Premium'}</span>
                                    <span className={`text-xs font-bold ${cost > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {cost > 0 ? `+₱${cost.toFixed(2)}` : 'Included'}
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

const DimensionSlider = memo(({ field, standard, min, max, value, pricePerInch, onChange, unitShort }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleSliderChange = (e) => {
        const val = parseInt(e.target.value, 10);
        setLocalValue(val);
        onChange(val);
    };

    const increase = Math.max(0, localValue - standard);
    const addedCost = increase * pricePerInch;

    return (
        <div className="space-y-3">
            <div className="flex items-end justify-between">
                <label className="text-sm font-medium text-gray-700 capitalize">{field}</label>
                <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{localValue} {unitShort}</span>
                    {addedCost > 0 && (
                        <span className="block text-xs font-semibold text-emerald-600">
                            +₱{addedCost.toFixed(2)} ({increase}" extra)
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400 w-8 text-right">{min}</span>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step="1"
                    value={localValue}
                    onChange={handleSliderChange}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6F4E37]"
                />
                <span className="text-xs text-gray-400 w-8">{max}</span>
            </div>
        </div>
    );
});

/* ══════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════ */

export default function Show({ product, units, cartItem = null }) {
    const { flash } = usePage().props;
    const unitShort = units?.dimensionShort || 'in';
    const isEditMode = !!cartItem;

    const [showToast, setShowToast] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [quantity, setQuantity] = useState(cartItem?.quantity ?? 1);
    const [submitting, setSubmitting] = useState(false);

    const activeVariants = (product.variants || []).filter((v) => v.is_active);
    const [selectedVariantId, setSelectedVariantId] = useState(
        cartItem?.variant_id ?? activeVariants[0]?.id ?? null
    );
    const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId) || activeVariants[0] || null;

    const [finishOption, setFinishOption] = useState(
        cartItem?.customization_data?.finish_option ?? 'ordinary'
    );
    const [customizationData, setCustomizationData] = useState({});

    // ── Seed customization state from cart (edit) or defaults (add) ──
    useEffect(() => {
        const initialData = {};
        product.parts?.forEach((part) => {
            const savedPart = cartItem?.customization_data?.[part.id];
            initialData[part.id] = {};

            (part.dimension_fields || []).forEach((field) => {
                initialData[part.id][field] =
                    savedPart?.[field] ?? part[`standard_${field}`] ?? 0;
            });

            if (part.designs && part.designs.length > 0) {
                const preferred =
                    (savedPart?.design_id &&
                        part.designs.find((d) => d.id === savedPart.design_id)) ||
                    part.designs.find((d) => d.is_default) ||
                    part.designs[0];
                initialData[part.id].design_id = preferred.id;
            }
        });
        setCustomizationData(initialData);
    }, [product.id, cartItem?.id]);

    const { data, setData, post, processing, reset } = useForm({
        product_id: product.id,
        quantity: cartItem?.quantity ?? 1,
        customization: {},
        variant_id: cartItem?.variant_id ?? activeVariants[0]?.id ?? null,
    });

    useEffect(() => {
        setData('variant_id', selectedVariantId);
    }, [selectedVariantId]);

    useEffect(() => {
        if (flash.success) {
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash.success]);

    const parts = product.parts || [];
    const totalParts = parts.length;
    const totalSteps = totalParts + 1;
    const stepContainerRef = useRef(null);

    const handleUpdateDimension = useCallback((partId, field, val) => {
        setCustomizationData((prev) => ({
            ...prev,
            [partId]: { ...(prev[partId] || {}), [field]: val },
        }));
    }, []);

    const handleUpdateDesign = useCallback((partId, designId) => {
        setCustomizationData((prev) => ({
            ...prev,
            [partId]: { ...(prev[partId] || {}), design_id: designId },
        }));
    }, []);

    const calculatedPrices = useMemo(() => {
        let base = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
        let finishSurcharge = 0;
        let dimensionSurcharge = 0;
        let designSurcharge = 0;

        if (finishOption === 'standard') {
            finishSurcharge = Number(product.standard_finish_surcharge || 0);
        }

        parts.forEach((part) => {
            const partData = customizationData[part.id] || {};

            if (part.is_customizable && part.dimension_pricing) {
                (part.dimension_fields || []).forEach((field) => {
                    const standardVal = Number(part[`standard_${field}`] || 0);
                    const currentVal = Number(partData[field] || standardVal);
                    const pricePerInch = Number(part.dimension_pricing[field] || 0);
                    if (currentVal > standardVal) {
                        dimensionSurcharge += (currentVal - standardVal) * pricePerInch;
                    }
                });
            }

            if (part.designs && part.designs.length > 0) {
                const selectedDesignId = partData.design_id;
                const design = part.designs.find((d) => d.id === selectedDesignId);
                if (design && !design.is_default) {
                    designSurcharge += Number(design.additional_cost || 0);
                }
            }
        });

        const totalPerUnit = base + finishSurcharge + dimensionSurcharge + designSurcharge;
        return { base, finishSurcharge, dimensionSurcharge, designSurcharge, totalPerUnit, grandTotal: totalPerUnit * quantity };
    }, [selectedVariant, finishOption, customizationData, quantity, parts, product]);

    const openModal = () => { setCurrentStep(0); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setCurrentStep(0); reset(); };

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape' && isModalOpen) closeModal(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isModalOpen]);

    useEffect(() => {
        document.body.style.overflow = isModalOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    const goToNext = () => {
        if (isTransitioning) return;
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

    // ── Unified submit: creates a new cart line OR updates the existing one ──
    const handleSubmit = () => {
        const payload = {
            quantity,
            variant_id: selectedVariantId,
            customization: { ...customizationData, finish_option: finishOption },
        };

        setSubmitting(true);

        if (isEditMode) {
            router.put(route('customer.cart.update-customization', cartItem.id), payload, {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
                onError: (errors) => {
                    console.error(errors);
                    alert('Could not update cart item. Please try again.');
                },
            });
        } else {
            setData({ ...data, ...payload });
            post(route('customer.cart.add'), {
                preserveScroll: true,
                onSuccess: () => { closeModal(); setQuantity(1); },
                onError: (errors) => {
                    console.error(errors);
                    alert('Could not add to cart. Please try again.');
                },
                onFinish: () => setSubmitting(false),
            });
        }
    };

    /* ══════════════════════════════════════════════════════════════
     *  RENDER WIZARD CONTENT
     * ══════════════════════════════════════════════════════════════ */
    const renderWizardContent = () => {
        const isReviewStep = currentStep === totalParts;
        const currentPart = isReviewStep ? null : parts[currentStep];

        return (
            <div className="flex flex-col h-full bg-gray-50/30">
                <div className="flex-shrink-0 px-6 sm:px-8 pt-6 pb-5 border-b border-gray-100 bg-white">
                    <div className="pr-10">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6F4E37]">
                            {isReviewStep ? 'Final Step' : `Step ${currentStep + 1} of ${totalSteps}`}
                        </p>
                        <h2 className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                            {isReviewStep
                                ? (isEditMode ? 'Review your changes' : 'Review your customization')
                                : `Customize ${currentPart.name}`}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {isReviewStep
                                ? 'Double-check your selections before saving.'
                                : 'Select a design and adjust dimensions below.'}
                        </p>
                    </div>

                    <div className="mt-5 flex items-center gap-1.5">
                        {parts.map((p, idx) => (
                            <div key={p.id} className="flex-1">
                                <div className={`h-1.5 rounded-full transition-all duration-500 ${idx < currentStep ? 'bg-[#6F4E37]' : idx === currentStep ? 'bg-[#6F4E37]/50' : 'bg-gray-200'}`} />
                            </div>
                        ))}
                        <div className="flex-1">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${isReviewStep ? 'bg-[#6F4E37]/60' : 'bg-gray-200'}`} />
                        </div>
                    </div>
                </div>

                <div ref={stepContainerRef} className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6">
                    <div className="transition-all duration-300 ease-out" style={{ transform: isTransitioning ? 'translateX(-16px)' : 'translateX(0)', opacity: isTransitioning ? 0 : 1 }}>
                        {isReviewStep ? (

                            /* ─── VISUAL REVIEW STEP ─── */
                            <div className="space-y-6">

                                {/* 1. Wood Type & Finish Summary */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Wood & Finish</h4>
                                    <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                                        <div className="w-24 h-24 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                                            {selectedVariant?.images?.[0]?.path || product.images?.[0]?.path ? (
                                                <img
                                                    src={`/storage/${selectedVariant?.images?.[0]?.path || product.images[0].path}`}
                                                    alt="Wood"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <CubeIcon className="w-8 h-8 m-auto mt-8 text-stone-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 font-semibold mb-1">Selected Wood</p>
                                            <div className="flex items-baseline justify-between">
                                                <p className="text-lg font-bold text-gray-900">{selectedVariant?.name}</p>
                                                <p className="text-base font-bold text-gray-900">₱{calculatedPrices.base.toFixed(2)}</p>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-baseline justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-500 font-semibold mb-0.5">Selected Finish</p>
                                                    <p className="text-sm font-bold text-gray-800">
                                                        {finishOption === 'standard' ? 'Standard' : 'Ordinary'}
                                                        {finishOption === 'standard' && product.finish_material && ` (${product.finish_material.name})`}
                                                    </p>
                                                </div>
                                                <p className={`text-sm font-bold ${calculatedPrices.finishSurcharge > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                    {calculatedPrices.finishSurcharge > 0 ? `+₱${calculatedPrices.finishSurcharge.toFixed(2)}` : 'Included'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Furniture Parts Breakdown */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider px-1">Furniture Parts</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {parts.map((part) => {
                                            const partData = customizationData[part.id] || {};
                                            const design = part.designs?.find(d => d.id === partData.design_id);

                                            let partDimCost = 0;
                                            if (part.is_customizable && part.dimension_pricing) {
                                                (part.dimension_fields || []).forEach(f => {
                                                    const std = Number(part[`standard_${f}`] || 0);
                                                    const cur = Number(partData[f] || std);
                                                    const rate = Number(part.dimension_pricing[f] || 0);
                                                    if (cur > std) partDimCost += (cur - std) * rate;
                                                });
                                            }

                                            const designCost = (design && !design.is_default) ? Number(design.additional_cost) : 0;

                                            return (
                                                <div key={part.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                                                        {part.reference_image ? (
                                                            <img src={part.reference_image} className="h-10 w-10 rounded-lg object-cover border border-gray-200" alt="" />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 font-bold text-sm">
                                                                {part.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <h5 className="text-base font-bold text-gray-900">{part.name}</h5>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {design && (
                                                            <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
                                                                <div className="h-14 w-14 rounded-lg bg-white overflow-hidden shadow-sm shrink-0 border border-stone-200">
                                                                    {design.image_path ? (
                                                                        <img src={`/storage/${design.image_path}`} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <PaintBrushIcon className="h-6 w-6 m-auto mt-4 text-stone-300" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] uppercase font-bold text-stone-500 mb-0.5">Design</p>
                                                                    <p className="text-sm font-semibold text-gray-900 truncate">{design.name}</p>
                                                                    <p className={`text-xs font-bold mt-1 ${designCost > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                                        {designCost > 0 ? `+₱${designCost.toFixed(2)}` : 'Included'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {part.is_customizable && (part.dimension_fields || []).length > 0 && (
                                                            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                                                                <p className="text-[10px] uppercase font-bold text-stone-500 mb-2">Dimensions ({unitShort})</p>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {(part.dimension_fields || []).map(f => {
                                                                        const val = partData[f] || part[`standard_${f}`];
                                                                        const isChanged = Number(val) !== Number(part[`standard_${f}`]);
                                                                        return (
                                                                            <div key={f} className="flex justify-between items-baseline">
                                                                                <span className="text-xs text-gray-500 capitalize">{f}:</span>
                                                                                <span className={`text-sm font-semibold ${isChanged ? 'text-[#6F4E37]' : 'text-gray-900'}`}>
                                                                                    {val}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {partDimCost > 0 && (
                                                                    <p className="text-xs font-bold text-emerald-600 mt-2 pt-2 border-t border-stone-200">
                                                                        +₱{partDimCost.toFixed(2)} size adj.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 3. Final Total Calculation */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-sm font-bold text-emerald-900 mb-3 uppercase tracking-wider">Price Summary</h4>
                                    <ul className="space-y-2 text-sm text-emerald-800">
                                        <li className="flex justify-between">
                                            <span>Base ({selectedVariant?.name})</span>
                                            <span>₱{calculatedPrices.base.toFixed(2)}</span>
                                        </li>
                                        {calculatedPrices.finishSurcharge > 0 && (
                                            <li className="flex justify-between">
                                                <span>Standard Finish</span>
                                                <span>+₱{calculatedPrices.finishSurcharge.toFixed(2)}</span>
                                            </li>
                                        )}
                                        {calculatedPrices.designSurcharge > 0 && (
                                            <li className="flex justify-between">
                                                <span>Premium Designs</span>
                                                <span>+₱{calculatedPrices.designSurcharge.toFixed(2)}</span>
                                            </li>
                                        )}
                                        {calculatedPrices.dimensionSurcharge > 0 && (
                                            <li className="flex justify-between">
                                                <span>Dimension Adjustments</span>
                                                <span>+₱{calculatedPrices.dimensionSurcharge.toFixed(2)}</span>
                                            </li>
                                        )}
                                    </ul>
                                    <div className="mt-3 pt-3 border-t border-emerald-200 flex justify-between items-center">
                                        <span className="text-base font-bold text-emerald-900">Total per unit</span>
                                        <span className="text-xl font-bold text-emerald-900">₱{calculatedPrices.totalPerUnit.toFixed(2)}</span>
                                    </div>
                                    <div className="mt-1 flex justify-between items-center">
                                        <span className="text-sm font-medium text-emerald-700">Quantity</span>
                                        <span className="text-sm font-medium text-emerald-700">× {quantity}</span>
                                    </div>
                                    <div className="mt-2 pt-2 flex justify-between items-center">
                                        <span className="text-lg font-bold text-emerald-900">Grand Total</span>
                                        <span className="text-2xl font-black text-emerald-900">₱{calculatedPrices.grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                <div className="flex gap-4 items-start">
                                    {currentPart.reference_image ? (
                                        <img src={currentPart.reference_image} className="h-16 w-16 rounded-xl object-cover border shadow-sm" alt="" />
                                    ) : (
                                        <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xl shadow-sm">
                                            {currentPart.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{currentPart.name}</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {currentPart.designs?.length > 0 && currentPart.is_customizable ? 'Choose a design, then resize it below.' : currentPart.designs?.length > 0 ? 'Select a design below.' : 'Adjust the sliders below to customize the size.'}
                                        </p>
                                    </div>
                                </div>

                                <DesignGallery
                                    designs={currentPart.designs}
                                    selectedId={customizationData[currentPart.id]?.design_id}
                                    onSelect={(designId) => handleUpdateDesign(currentPart.id, designId)}
                                />

                                {currentPart.is_customizable && currentPart.designs?.length > 0 && (
                                    <div className="flex items-center gap-4 bg-[#F5EDE8]/50 border border-[#6F4E37]/20 rounded-2xl p-4">
                                        <div className="h-16 w-16 rounded-lg bg-white overflow-hidden shadow-sm shrink-0 border border-[#6F4E37]/10">
                                            {(() => {
                                                const selectedId = customizationData[currentPart.id]?.design_id;
                                                const design = currentPart.designs.find(d => d.id === selectedId);
                                                return design?.image_path ? <img src={`/storage/${design.image_path}`} alt="" className="w-full h-full object-cover" /> : <PaintBrushIcon className="h-6 w-6 m-auto mt-5 text-gray-400" />;
                                            })()}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6F4E37]">Selected Design</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {(() => {
                                                    const selectedId = customizationData[currentPart.id]?.design_id;
                                                    const design = currentPart.designs.find(d => d.id === selectedId);
                                                    return design ? design.name : 'None';
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {currentPart.is_customizable && (currentPart.dimension_fields || []).length > 0 && (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ArrowsPointingOutIcon className="h-5 w-5 text-[#6F4E37]" />
                                            <h4 className="text-sm font-semibold text-gray-900">
                                                {currentPart.designs?.length > 0 ? '2. Adjust Dimensions' : 'Adjust Dimensions'}
                                            </h4>
                                        </div>

                                        {(currentPart.dimension_fields || []).map((field) => {
                                            const standard = Number(currentPart[`standard_${field}`] || 0);
                                            const bounds = currentPart.dimension_bounds?.[field] || {};
                                            const min = bounds.min !== null ? Math.floor(Number(bounds.min)) : Math.max(0, standard - 10);
                                            const max = bounds.max !== null ? Math.ceil(Number(bounds.max)) : standard + 20;
                                            const pricePerInch = Number(currentPart.dimension_pricing?.[field] || 0);

                                            return (
                                                <DimensionSlider
                                                    key={field}
                                                    field={field}
                                                    standard={standard}
                                                    min={min}
                                                    max={max}
                                                    value={customizationData[currentPart.id]?.[field] ?? standard}
                                                    pricePerInch={pricePerInch}
                                                    unitShort={unitShort}
                                                    onChange={(val) => handleUpdateDimension(currentPart.id, field, val)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 flex items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 sm:px-8 py-4">
                    <button
                        onClick={goToPrevious}
                        disabled={currentStep === 0 || isTransitioning}
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeftIcon className="h-4 w-4" /> Previous
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Current Total</p>
                            <p className="text-lg font-bold text-[#6F4E37]">₱{calculatedPrices.totalPerUnit.toFixed(2)}</p>
                        </div>

                        {isReviewStep ? (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#6F4E37] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#5A3E2B] disabled:opacity-50"
                            >
                                {submitting || processing
                                    ? (isEditMode ? 'Saving...' : 'Adding...')
                                    : (isEditMode ? 'Save Changes' : 'Add to Cart')}
                                <CheckCircleIcon className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                onClick={goToNext}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#6F4E37] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#5A3E2B]"
                            >
                                {currentStep === totalParts - 1 ? 'Review' : 'Next'}
                                <ChevronRightIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <GuestLayout>
            <Head title={isEditMode ? `Edit ${product.name}` : product.name} />

            {showToast && flash.success && (
                <div className="fixed top-4 right-4 z-50 max-w-sm bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium flex-1">{flash.success}</span>
                </div>
            )}

            <div className="min-h-screen lg:h-[calc(100vh-80px)] bg-[#F8F6F4] py-2 sm:py-4 lg:py-6 flex flex-col">
                <div className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col h-full">

                    <div className="mb-2 lg:mb-4 shrink-0">
                        {isEditMode ? (
                            <a href={route('customer.cart.index')} className="inline-flex items-center text-xs sm:text-sm font-semibold text-stone-500 hover:text-[#6F4E37] transition-colors">
                                <ArrowLeftIcon className="h-4 w-4 mr-1.5" /> Back to Cart
                            </a>
                        ) : (
                            <a href={route('shop.index')} className="inline-flex items-center text-xs sm:text-sm font-semibold text-stone-500 hover:text-[#6F4E37] transition-colors">
                                <ArrowLeftIcon className="h-4 w-4 mr-1.5" /> Back to Shop
                            </a>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden flex-1 flex flex-col lg:flex-row max-h-full">
                        <div className="lg:w-[55%] bg-[#F3EFE9] relative flex items-center justify-center p-6 sm:p-10 lg:p-12 h-[300px] lg:h-full shrink-0">
                            <div className="relative w-full h-full flex items-center justify-center">
                                <MainProductImage
                                    src={selectedVariant?.images?.[0]?.path ? `/storage/${selectedVariant.images[0].path}` : null}
                                    fallbackSrc={product.images?.[0]?.path ? `/storage/${product.images[0].path}` : null}
                                    alt={product.name}
                                />
                            </div>
                        </div>

                        <div className="lg:w-[45%] flex flex-col h-full bg-white min-h-0">
                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 space-y-6 custom-scrollbar">
                                <div>
                                    {isEditMode && (
                                        <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md mb-2 mr-2">
                                            Editing Cart Item
                                        </span>
                                    )}
                                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#6F4E37] bg-[#6F4E37]/10 px-2.5 py-1 rounded-md mb-3">
                                        {product.category?.name || 'Furniture'}
                                    </span>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
                                        {product.name}
                                    </h1>
                                    <p className="mt-2 text-sm text-stone-500 leading-relaxed line-clamp-2">
                                        {product.description}
                                    </p>
                                </div>

                                <div className="w-full h-px bg-stone-100" />

                                {activeVariants.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">1. Select Wood</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {activeVariants.map((variant) => {
                                                const isSelected = selectedVariantId === variant.id;
                                                return (
                                                    <button
                                                        key={variant.id}
                                                        onClick={() => setSelectedVariantId(variant.id)}
                                                        className={`flex flex-col p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                                                            isSelected ? 'border-[#6F4E37] bg-[#6F4E37]/5 shadow-sm' : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                                                        }`}
                                                    >
                                                        <span className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${isSelected ? 'text-[#6F4E37]' : 'text-stone-500'}`}>
                                                            {variant.name}
                                                        </span>
                                                        <span className={`text-lg font-black tracking-tight ${isSelected ? 'text-[#6F4E37]' : 'text-stone-900'}`}>
                                                            ₱{Number(variant.price).toLocaleString()}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">2. Finish</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setFinishOption('ordinary')}
                                            className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${finishOption === 'ordinary' ? 'border-[#6F4E37] bg-[#6F4E37]/5 shadow-sm' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-bold ${finishOption === 'ordinary' ? 'text-[#6F4E37]' : 'text-stone-800'}`}>Ordinary</span>
                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Included</span>
                                            </div>
                                            <span className="block text-[11px] text-stone-500 mt-1 leading-tight line-clamp-1">No varnish applied</span>
                                        </button>

                                        <button
                                            onClick={() => setFinishOption('standard')}
                                            className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${finishOption === 'standard' ? 'border-[#6F4E37] bg-[#6F4E37]/5 shadow-sm' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-bold ${finishOption === 'standard' ? 'text-[#6F4E37]' : 'text-stone-800'}`}>Standard</span>
                                                {Number(product.standard_finish_surcharge) > 0 ? (
                                                    <span className="text-[10px] font-bold text-[#6F4E37] bg-[#6F4E37]/10 px-1.5 py-0.5 rounded">+₱{Number(product.standard_finish_surcharge).toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Included</span>
                                                )}
                                            </div>
                                            <span className="block text-[11px] text-stone-500 mt-1 leading-tight line-clamp-1">{product.finish_material?.name || 'Varnish applied'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">3. Quantity</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 font-bold transition-colors">-</button>
                                            <input
                                                type="number"
                                                min="1"
                                                max={product.stock_quantity}
                                                value={quantity}
                                                onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                                                className="w-12 text-center border-none focus:ring-0 text-sm font-bold text-stone-900"
                                            />
                                            <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 font-bold transition-colors">+</button>
                                        </div>
                                        <span className="text-xs font-medium text-stone-500">
                                            {product.stock_quantity > 5 ? 'In Stock' : `Only ${product.stock_quantity} left`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 p-6 sm:p-8 lg:p-10 bg-white border-t border-stone-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                                <div className="flex items-end justify-between mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">Total Price</p>
                                        <p className="text-2xl sm:text-3xl font-extrabold text-[#6F4E37] tracking-tight">
                                            ₱{calculatedPrices.grandTotal.toFixed(2)}
                                        </p>
                                    </div>
                                    <span className="text-xs font-medium text-stone-400 mb-1">({quantity} unit{quantity > 1 ? 's' : ''})</span>
                                </div>

                                <button
                                    onClick={openModal}
                                    className="w-full relative overflow-hidden inline-flex justify-center items-center px-6 py-3.5 bg-[#6F4E37] text-white text-sm font-bold rounded-xl shadow-lg hover:bg-[#5A3E2B] hover:shadow-xl transition-all group"
                                >
                                    <SparklesIcon className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                                    {isEditMode ? 'Review & Update Customization' : 'Customize & Add to Cart'}
                                </button>

                                {isEditMode && (
                                    <a
                                        href={route('customer.cart.index')}
                                        className="mt-2 block text-center text-xs font-medium text-stone-500 hover:text-[#6F4E37]"
                                    >
                                        ← Back to Cart
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative flex h-[85vh] max-h-[800px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl animate-fade-in-up">
                        <button onClick={closeModal} className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-100">
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
