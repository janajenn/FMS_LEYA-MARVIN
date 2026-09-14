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

    const { data, setData, post, processing, reset } = useForm({
        product_id: product.id,
        quantity: 1,
        customization: [],
    });

    const parts = product.parts || [];
    const isCustomizable = product.is_customizable && parts.length > 0;
    const totalParts = parts.length;
    const totalSteps = totalParts + 1;

    const hasFinishes = product.finishes && product.finishes.length > 0;
    const isFinishRequired = hasFinishes;

    const stepContainerRef = useRef(null);

    // Show toast when flash.success appears
    useEffect(() => {
        if (flash.success) {
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash.success]);

    // Modal controls
    const openModal = () => {
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

    // ESC key to close
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isModalOpen) closeModal();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isModalOpen]);

    // Body scroll lock
    useEffect(() => {
        document.body.style.overflow = isModalOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    // Dimension handlers
    const handleDimensionChange = (partId, field, value) => {
        setCustomizationData(prev => ({
            ...prev,
            [partId]: { ...(prev[partId] || {}), [field]: value },
        }));
        if (stepErrors[partId]?.includes(field)) {
            setStepErrors(prev => {
                const newErrors = { ...prev };
                newErrors[partId] = newErrors[partId].filter(f => f !== field);
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
        const missing = fields.filter(f => !entered[f] || entered[f] === '');
        if (missing.length > 0) {
            setStepErrors(prev => ({ ...prev, [part.id]: missing }));
            return false;
        }
        setStepErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[part.id];
            return newErrors;
        });
        return true;
    };

    const goToNext = () => {
        if (isTransitioning) return;
        if (currentStep < totalParts && !validateStep(currentStep)) {
            stepContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return;
        }
        if (currentStep < totalSteps - 1) {
            setIsTransitioning(true);
            setCurrentStep(prev => prev + 1);
            setTimeout(() => setIsTransitioning(false), 300);
        }
    };

    const goToPrevious = () => {
        if (isTransitioning) return;
        if (currentStep > 0) {
            setIsTransitioning(true);
            setCurrentStep(prev => prev - 1);
            setTimeout(() => setIsTransitioning(false), 300);
        }
    };

    const isAllValid = () => {
        for (let i = 0; i < totalParts; i++) {
            const part = parts[i];
            const entered = customizationData[part.id] || {};
            const fields = part.dimension_fields || [];
            const missing = fields.filter(f => !entered[f] || entered[f] === '');
            if (missing.length > 0) {
                setStepErrors(prev => ({ ...prev, [part.id]: missing }));
                return false;
            }
        }
        return true;
    };

    const handleAddToCart = () => {
        if (isFinishRequired && !selectedFinish) {
            alert('Please select a finish for this product.');
            return;
        }

        if (mode === 'customize') {
            let isValid = true;
            const allErrors = {};
            for (let i = 0; i < totalParts; i++) {
                const part = parts[i];
                const entered = customizationData[part.id] || {};
                const fields = part.dimension_fields || [];
                const missing = fields.filter(f => !entered[f] || entered[f] === '');
                if (missing.length > 0) {
                    allErrors[part.id] = missing;
                    isValid = false;
                }
            }
            if (!isValid) {
                setStepErrors(allErrors);
                const firstErrorPart = parts.findIndex(p => allErrors[p.id]);
                if (firstErrorPart !== -1) {
                    setCurrentStep(firstErrorPart);
                    stepContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                return;
            }
        }

        let customization = {};
        if (selectedFinish) {
            customization.finish_id = selectedFinish;
        }
        if (mode === 'customize') {
            customization = { ...customization, ...customizationData };
        }

        const finalCustomization = Object.keys(customization).length > 0 ? customization : [];

        setData('quantity', quantity);
        setData('customization', finalCustomization);

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

    // ------- Modal Renderers -------
    const renderDimensionInputs = (part) => {
        const fields = part.dimension_fields || [];
        if (fields.length === 0) return null;

        return (
            <div className="grid grid-cols-2 gap-3 mt-3">
                {fields.map(field => {
                    const value = customizationData[part.id]?.[field] || '';
                    const hasError = stepErrors[part.id]?.includes(field);
                    return (
                        <div key={field} className="flex flex-col">
                            <label className="text-xs font-medium text-white/80 capitalize">
                                {field} <span className="text-red-300">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={value}
                                onChange={e => handleDimensionChange(part.id, field, e.target.value)}
                                className={`mt-1 block w-full rounded-lg border ${
                                    hasError ? 'border-red-400' : 'border-white/20'
                                } bg-white/10 backdrop-blur-sm px-3 py-2 text-sm text-white placeholder-white/50 focus:border-white/50 focus:ring-2 focus:ring-white/30 transition-all`}
                                placeholder={`Enter ${field.toLowerCase()}`}
                            />
                            {hasError && <span className="text-xs text-red-300 mt-0.5">Required</span>}
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
                {/* Progress Bar */}
                <div className="mb-5">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-white/90">
                            {isReviewStep ? '🎯 Review & Confirm' : `Part ${currentStep + 1} of ${totalParts}`}
                        </span>
                        <span className="text-sm font-medium text-white/70">
                            {Math.round((currentStep / totalSteps) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 backdrop-blur-sm">
                        <div
                            className="bg-gradient-to-r from-white/80 to-white/50 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div
                    ref={stepContainerRef}
                    className="relative flex-1 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-5 md:p-7 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    <div
                        className="transition-all duration-350 ease-in-out h-full relative z-10"
                        style={{
                            transform: isTransitioning ? 'translateX(-20px) scale(0.97)' : 'translateX(0) scale(1)',
                            opacity: isTransitioning ? 0 : 1,
                        }}
                    >
                        {isReviewStep ? (
                            // Review Step
                            <div className="space-y-4 h-full overflow-y-auto pr-1">
                                <h3 className="text-xl font-bold text-white">Review Your Customization</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {parts.map(part => {
                                        const entered = customizationData[part.id] || {};
                                        const fields = part.dimension_fields || [];
                                        const hasMissing = fields.some(f => !entered[f] || entered[f] === '');
                                        if (hasMissing) {
                                            return (
                                                <div key={part.id} className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-3">
                                                    <p className="text-sm text-red-200 font-medium">{part.name}</p>
                                                    <p className="text-xs text-red-300">Missing: {fields.filter(f => !entered[f] || entered[f] === '').join(', ')}</p>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={part.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3 flex items-start gap-3">
                                                {part.reference_image && (
                                                    <img
                                                        src={part.reference_image}
                                                        alt={part.name}
                                                        className="h-12 w-12 object-cover rounded-lg border border-white/20 flex-shrink-0"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-white text-sm">{part.name}</h4>
                                                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-0.5">
                                                        {fields.map(f => (
                                                            <span key={f} className="text-xs text-white/70">
                                                                <span className="font-medium capitalize">{f}:</span> {entered[f] || '-'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {!isAllValid() && (
                                    <p className="text-red-300 text-sm">Please fill in all missing dimensions.</p>
                                )}
                            </div>
                        ) : (
                            // Part Step
                            <div className="flex flex-col md:flex-row gap-6 h-full">
                                <div className="md:w-2/5 flex-shrink-0 flex flex-col items-center justify-center">
                                    <div className="aspect-square w-full max-w-[220px] mx-auto bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-transform hover:scale-[1.02] duration-300">
                                        {currentPart.reference_image ? (
                                            <img
                                                src={currentPart.reference_image}
                                                alt={currentPart.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                                                No image
                                            </div>
                                        )}
                                    </div>
                                    {totalParts > 1 && (
                                        <div className="flex gap-2 mt-3 justify-center overflow-x-auto pb-1">
                                            {parts.map((p, idx) => (
                                                <div
                                                    key={p.id}
                                                    className={`h-10 w-10 flex-shrink-0 rounded-xl border-2 overflow-hidden transition-all ${
                                                        idx === currentStep
                                                            ? 'border-white/80 shadow-md'
                                                            : 'border-white/20 opacity-40 hover:opacity-70'
                                                    }`}
                                                >
                                                    {p.reference_image ? (
                                                        <img src={p.reference_image} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-[8px] text-white/40">
                                                            {p.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col min-w-0">
                                    <h3 className="text-2xl font-bold text-white">{currentPart.name}</h3>
                                    <p className="text-sm text-white/60 mt-0.5">Part {currentStep + 1} of {totalParts}</p>
                                    <div className="mt-2 text-sm text-white/70">
                                        <span className="font-medium">Dimensions required:</span>{' '}
                                        {currentPart.dimension_fields?.join(', ') || 'None'}
                                    </div>
                                    {renderDimensionInputs(currentPart)}
                                    <div className="flex-1" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/10">
                    <button
                        onClick={goToPrevious}
                        disabled={currentStep === 0 || isTransitioning}
                        className="inline-flex items-center px-5 py-2.5 border border-white/20 text-sm font-medium rounded-xl text-white/80 bg-white/5 backdrop-blur-sm hover:bg-white/20 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        <ChevronLeftIcon className="h-4 w-4 mr-1" />
                        Previous
                    </button>

                    {isReviewStep ? (
                        <button
                            onClick={handleAddToCart}
                            disabled={processing || !isAllValid()}
                            className="inline-flex items-center px-7 py-2.5 bg-white text-[#6F4E37] text-sm font-semibold rounded-xl hover:bg-white/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {processing ? 'Adding...' : 'Add to Cart'}
                            <CheckCircleIcon className="h-4 w-4 ml-2" />
                        </button>
                    ) : (
                        <button
                            onClick={goToNext}
                            disabled={isTransitioning}
                            className="inline-flex items-center px-7 py-2.5 bg-white text-[#6F4E37] text-sm font-semibold rounded-xl hover:bg-white/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {currentStep === totalParts - 1 ? 'Review' : 'Next'}
                            <ChevronRightIcon className="h-4 w-4 ml-1" />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // ------- Main Render -------
    return (
        <GuestLayout>
            <Head title={product.name} />

            {/* Toast Notification */}
            {showToast && flash.success && (
                <div className="fixed top-4 right-4 z-50 max-w-sm bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium flex-1">{flash.success}</span>
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
                                {/* Left – Images */}
                                <div>
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                        {product.images?.length > 0 ? (
                                            <img
                                                src={`/storage/${product.images[0].path}`}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    {product.images?.length > 1 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                            {product.images.slice(1).map(img => (
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

                                {/* Right – Details */}
                                <div className="flex flex-col">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                        {product.name}
                                    </h1>

                                    <div className="mt-2 flex items-baseline gap-3">
                                        <span className="text-2xl font-bold text-[#6F4E37]">
                                            ₱{product.price}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                        <span className="text-sm text-gray-500">
                                            Category: {product.category?.name}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock_quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            Stock: {product.stock_quantity}
                                        </span>
                                    </div>

                                    <p className="mt-4 text-gray-600 leading-relaxed">
                                        {product.description}
                                    </p>

                                    {/* Finish Selection */}
                                    {hasFinishes && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                                Select Finish
                                            </h3>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {product.finishes.map(finish => (
                                                    <button
                                                        key={finish.id}
                                                        onClick={() => setSelectedFinish(finish.id)}
                                                        className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                                                            selectedFinish === finish.id
                                                                ? 'border-[#6F4E37] bg-[#6F4E37] text-white'
                                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {finish.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quantity Selector */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                                                Quantity:
                                            </label>
                                            <input
                                                type="number"
                                                id="quantity"
                                                min="1"
                                                max={product.stock_quantity || 99}
                                                value={quantity}
                                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-center focus:ring-1 focus:ring-[#6F4E37] focus:border-[#6F4E37]"
                                            />
                                            <span className="text-xs text-gray-500">(max {product.stock_quantity})</span>
                                        </div>
                                    </div>

                                    {/* Customization / Add to Cart */}
                                    {isCustomizable ? (
                                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                                Choose your experience
                                            </h3>

                                            <button
                                                onClick={handleAddToCart}
                                                disabled={processing || product.stock_quantity < 1 || (isFinishRequired && !selectedFinish)}
                                                className="w-full inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {product.stock_quantity < 1 ? 'Out of Stock' : 'Buy Standard'}
                                            </button>

                                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#6F4E37]/5 to-[#6F4E37]/10 border border-[#6F4E37]/20 p-5 transition-all hover:shadow-md hover:border-[#6F4E37]/40 group">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-[#6F4E37]/10 rounded-lg group-hover:bg-[#6F4E37]/20 transition-colors">
                                                        <SparklesIcon className="h-5 w-5 text-[#6F4E37]" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-base font-semibold text-gray-900">
                                                            Would you like to customize your furniture?
                                                        </h4>
                                                        <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                                                            Make it truly yours by customizing the dimensions of each furniture part to match your exact needs and preferences.
                                                        </p>
                                                        <button
                                                            onClick={openModal}
                                                            disabled={isFinishRequired && !selectedFinish}
                                                            className="mt-3 inline-flex items-center px-5 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-all shadow-sm group-hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                disabled={processing || product.stock_quantity < 1 || (isFinishRequired && !selectedFinish)}
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
                                                    : 'Add to Cart'
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customization Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-all duration-300"
                    onClick={closeModal}
                >
                    <div
                        className="relative w-full max-w-4xl h-[85vh] max-h-[620px] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-fade-in-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all text-white/80 hover:text-white border border-white/10"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                        <div className="h-full p-5 md:p-7 flex flex-col">
                            {renderWizardContent()}
                        </div>
                    </div>
                </div>
            )}
        </GuestLayout>
    );
}
