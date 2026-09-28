import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import StandardSizeSelector from '@/Components/StandardSizeSelector';
import { useState } from 'react';
import {
    PencilIcon,
    XMarkIcon,
    TagIcon,
    DocumentTextIcon,
    CurrencyDollarIcon,
    CubeIcon,
    PhotoIcon,
    PlusCircleIcon,
    TrashIcon,
    ChevronDownIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    InformationCircleIcon,
    WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

// ─── Dimension presets for furniture types ───────────────
const DIMENSION_PRESETS = {
    custom:     { label: 'Custom',      fields: [] },
    table:      { label: 'Table',       fields: ['Length', 'Width', 'Height'] },
    chair:      { label: 'Chair',       fields: ['Width', 'Depth', 'Height'] },
    shelf:      { label: 'Shelf',       fields: ['Width', 'Height', 'Depth'] },
    cabinet:    { label: 'Cabinet',     fields: ['Width', 'Height', 'Depth'] },
    bed:        { label: 'Bed',         fields: ['Length', 'Width', 'Height'] },
    bench:      { label: 'Bench',       fields: ['Length', 'Width', 'Height'] },
    roundTable: { label: 'Round Table', fields: ['Diameter', 'Height'] },
    cushion:    { label: 'Cushion',     fields: ['Length', 'Width', 'Thickness'] },
};

const DIMENSION_FIELDS = ['Length', 'Width', 'Height', 'Thickness', 'Diameter', 'Depth'];

const DIMENSION_HELP = {
    Length:    'Horizontal size (e.g., tabletop length)',
    Width:     'Horizontal size, perpendicular to length',
    Height:    'Vertical size — floor to top',
    Thickness: 'Board or cushion thickness. Leave off unless the customer must specify it.',
    Diameter:  'For round objects — replaces Length + Width',
    Depth:     'Front-to-back depth (shelves, cabinets, chairs)',
};

function detectPreset(fields) {
    const sorted = [...(fields || [])].sort().join(',');
    for (const [key, preset] of Object.entries(DIMENSION_PRESETS)) {
        if (key === 'custom') continue;
        if ([...preset.fields].sort().join(',') === sorted) return key;
    }
    return 'custom';
}

export default function Edit({
    product,
    categories = [],
    materials = [],
    finishMaterials = [],
    sizeTemplates = {},
}) {
    // ✅ Guard against missing product prop
    if (!product) {
        return (
            <AdminLayout>
                <Head title="Edit Product" />
                <div className="p-8 text-center">
                    <p className="text-red-600 font-medium">Product not found.</p>
                    <p className="text-sm text-gray-500 mt-2">
                        The product data was not provided by the server. Please check the controller.
                    </p>
                    <Link
                        href={route('admin.products.index')}
                        className="mt-4 inline-block text-[#6F4E37] hover:underline"
                    >
                        ← Back to Products
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    // ─── Build initial variants array (matching Create's shape) ───
    const initialVariants = (() => {
        const saved = product.variants || [];

        if (saved.length > 0) {
            return saved.map((v, i) => ({
                id: v.id,
                name: v.name,
                slug: v.slug,
                price: v.price,
                description: v.description || '',
                is_active: !!v.is_active,
                sort_order: v.sort_order ?? i,
                images: [],
                delete_images: [],
            }));
        }

        return [
            {
                name: 'Ordinary',
                slug: 'ordinary',
                price: '',
                description: '',
                is_active: true,
                sort_order: 0,
                images: [],
                delete_images: [],
            },
            {
                name: 'Standard',
                slug: 'standard',
                price: '',
                description: '',
                is_active: true,
                sort_order: 1,
                images: [],
                delete_images: [],
            },
        ];
    })();

    const [existingImages, setExistingImages] = useState(product.images || []);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [partImagePreviews, setPartImagePreviews] = useState({});

    const [existingVariantImages, setExistingVariantImages] = useState(() => {
        const map = {};
        (product.variants || []).forEach((v) => {
            map[v.slug] = v.images || [];
        });
        return map;
    });

    const [variantImagePreviews, setVariantImagePreviews] = useState({});

    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        category_id: product.category_id ?? '',
        name: product.name ?? '',
        description: product.description ?? '',
        price: product.price ?? '',
        stock_quantity: product.stock_quantity ?? 0,
        is_customizable: product.is_customizable ?? false,
        status: product.status ?? 'active',
        images: [],
        delete_images: [],
        materials: (product.materials || []).map((m) => ({
            id: m.id,
            quantity: m.pivot.quantity,
            unit: m.pivot.unit,
            calculation_rule: m.pivot.calculation_rule || 'fixed',
            coverage_rate: m.pivot.coverage_rate || '',
            formula: m.pivot.formula || '',
            is_finish: m.pivot.is_finish || false,
            sort_order: m.pivot.sort_order || 0,
        })),
        parts: (product.parts || []).map((p) => ({
            id: p.id,
            name: p.name,
            reference_image: p.reference_image || '',
            dimension_fields: p.dimension_fields || [],
            sort_order: p.sort_order || 0,
        })),
        standard_length:    product.standard_length    ?? '',
        standard_width:     product.standard_width     ?? '',
        standard_height:    product.standard_height    ?? '',
        standard_thickness: product.standard_thickness ?? '',
        standard_diameter:  product.standard_diameter  ?? '',
        standard_depth:     product.standard_depth     ?? '',
        customization_markup_percent: product.customization_markup_percent ?? 40,

        // ─── Labor Cost fields ───
        labor_cost: product.labor_cost ?? '',
        estimated_labor_hours: product.estimated_labor_hours ?? '',

        variants: initialVariants,
    });

    // ─── Product images ───
    const markImageForDeletion = (imageId) => {
        setData('delete_images', [...data.delete_images, imageId]);
        setExistingImages(existingImages.filter((img) => img.id !== imageId));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setImagePreviews(files.map((file) => URL.createObjectURL(file)));
        setData('images', files);
    };

    const removeNewImage = (index) => {
        const newImages = [...data.images];
        newImages.splice(index, 1);
        setData('images', newImages);
        const newPreviews = [...imagePreviews];
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    // ─── Variant image handling ───
    const handleVariantImageUpload = (vIdx, files) => {
        const slug = data.variants[vIdx].slug;
        const newVariants = [...data.variants];
        newVariants[vIdx].images = [...(newVariants[vIdx].images || []), ...files];
        setData('variants', newVariants);

        const newPreviews = { ...variantImagePreviews };
        newPreviews[slug] = [
            ...(newPreviews[slug] || []),
            ...files.map((f) => URL.createObjectURL(f)),
        ];
        setVariantImagePreviews(newPreviews);
    };

    const removeNewVariantImage = (vIdx, pi) => {
        const slug = data.variants[vIdx].slug;
        const newVariants = [...data.variants];
        newVariants[vIdx].images.splice(pi, 1);
        setData('variants', newVariants);

        const newPreviews = { ...variantImagePreviews };
        newPreviews[slug] = [...(newPreviews[slug] || [])];
        newPreviews[slug].splice(pi, 1);
        setVariantImagePreviews(newPreviews);
    };

    const markExistingVariantImageForDeletion = (vIdx, imageId) => {
        const slug = data.variants[vIdx].slug;
        const newVariants = [...data.variants];
        newVariants[vIdx].delete_images = [
            ...(newVariants[vIdx].delete_images || []),
            imageId,
        ];
        setData('variants', newVariants);

        setExistingVariantImages((prev) => ({
            ...prev,
            [slug]: (prev[slug] || []).filter((img) => img.id !== imageId),
        }));
    };

    // ─── Materials ───
    const addMaterial = () => {
        setData('materials', [
            ...data.materials,
            {
                id: '',
                quantity: '',
                unit: '',
                calculation_rule: 'fixed',
                formula: '',
                coverage_rate: '',
                is_finish: false,
                sort_order: data.materials.length,
            },
        ]);
    };

    const removeMaterial = (index) => {
        const newMats = [...data.materials];
        newMats.splice(index, 1);
        setData('materials', newMats);
    };

    const updateMaterial = (index, field, value) => {
        const newMats = [...data.materials];
        newMats[index][field] = value;
        setData('materials', newMats);
    };

    // ─── Parts ───
    const addPart = () => {
        setData('parts', [
            ...data.parts,
            {
                name: '',
                reference_image: '',
                dimension_fields: [],
                sort_order: data.parts.length,
            },
        ]);
    };

    const removePart = (index) => {
        const newParts = [...data.parts];
        newParts.splice(index, 1);
        setData('parts', newParts);
        const newPreviews = { ...partImagePreviews };
        delete newPreviews[index];
        setPartImagePreviews(newPreviews);
    };

    const updatePart = (index, field, value) => {
        const newParts = [...data.parts];
        newParts[index][field] = value;
        setData('parts', newParts);
    };

    const toggleDimensionField = (partIdx, field) => {
        const newParts = [...data.parts];
        const fields = newParts[partIdx].dimension_fields || [];
        newParts[partIdx].dimension_fields = fields.includes(field)
            ? fields.filter((f) => f !== field)
            : [...fields, field];
        setData('parts', newParts);
    };

    const applyPreset = (partIdx, presetKey) => {
        const preset = DIMENSION_PRESETS[presetKey];
        if (!preset || presetKey === 'custom') return;
        const newParts = [...data.parts];
        newParts[partIdx].dimension_fields = [...preset.fields];
        setData('parts', newParts);
    };

    const handlePartImageUpload = (partIdx, file) => {
        const preview = URL.createObjectURL(file);
        setPartImagePreviews((prev) => ({ ...prev, [partIdx]: preview }));
        const reader = new FileReader();
        reader.onload = () => {
            updatePart(partIdx, 'reference_image', reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removePartImage = (partIdx) => {
        updatePart(partIdx, 'reference_image', '');
        const newPreviews = { ...partImagePreviews };
        delete newPreviews[partIdx];
        setPartImagePreviews(newPreviews);
    };

    const movePart = (index, direction) => {
        const newParts = [...data.parts];
        const target = index + direction;
        if (target < 0 || target >= newParts.length) return;
        [newParts[index], newParts[target]] = [newParts[target], newParts[index]];
        newParts.forEach((p, i) => (p.sort_order = i));
        setData('parts', newParts);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const variantsToSubmit = data.variants.filter((v) => {
            return (
                v.id ||
                (v.price !== '' && v.price !== null && v.price !== undefined) ||
                v.description ||
                (v.images && v.images.length > 0)
            );
        });

        const ordinary = variantsToSubmit.find((v) => v.slug === 'ordinary');
        const standard = variantsToSubmit.find((v) => v.slug === 'standard');

        if (ordinary && standard) {
            if (!ordinary.price || !standard.price) {
                alert('Please set a price for both the Ordinary and Standard variants.');
                return;
            }
            const oPrice = parseFloat(ordinary.price || 0);
            const sPrice = parseFloat(standard.price || 0);

            if (oPrice >= sPrice) {
                alert('The Ordinary variant must be cheaper than the Standard variant.');
                return;
            }
        }

        // ─── Labor cost guard ───
        const price = parseFloat(data.price || 0);
        const labor = parseFloat(data.labor_cost || 0);
        if (labor > 0 && labor >= price) {
            alert(
                `Labor cost (₱${labor.toFixed(2)}) must be less than the retail price (₱${price.toFixed(2)}).`
            );
            return;
        }

        if (data.is_customizable) {
            if (
                !data.standard_length ||
                !data.standard_width ||
                !data.standard_height
            ) {
                alert(
                    'Please set the standard dimensions (Length, Width, Height) for this customizable product.'
                );
                return;
            }
        }

        setData('variants', variantsToSubmit);

        post(route('admin.products.update', product.id), {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Edit Product" />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-5">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        Edit Product
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Update product details
                                    </p>
                                </div>
                                <Link
                                    href={route('admin.products.index')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                                >
                                    <XMarkIcon className="h-5 w-5 mr-1.5" />
                                    Cancel
                                </Link>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {errors.error && (
                                    <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm font-medium whitespace-pre-line">
                                        {errors.error}
                                    </div>
                                )}

                                {/* ─── BASIC INFO ─── */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <TagIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <select
                                                value={data.category_id}
                                                onChange={(e) =>
                                                    setData('category_id', e.target.value)
                                                }
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                        {errors.category_id && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.category_id}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <CubeIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                                required
                                            />
                                        </div>
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Base Price <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.price}
                                                onChange={(e) =>
                                                    setData('price', e.target.value)
                                                }
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                                required
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Retail price. Should cover materials + labor + margin.
                                        </p>
                                        {errors.price && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.price}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Stock Quantity
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.stock_quantity}
                                            onChange={(e) =>
                                                setData(
                                                    'stock_quantity',
                                                    parseInt(e.target.value) || 0
                                                )
                                            }
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                        />
                                        {errors.stock_quantity && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.stock_quantity}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-3 pt-2">
                                        <input
                                            type="checkbox"
                                            id="is_customizable"
                                            checked={data.is_customizable}
                                            onChange={(e) =>
                                                setData('is_customizable', e.target.checked)
                                            }
                                            className="h-4 w-4 rounded border-gray-300 text-[#6F4E37] focus:ring-[#6F4E37]"
                                        />
                                        <label
                                            htmlFor="is_customizable"
                                            className="text-sm text-gray-700 font-medium"
                                        >
                                            Customizable
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={data.status}
                                                onChange={(e) =>
                                                    setData('status', e.target.value)
                                                }
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] appearance-none"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                        {errors.status && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.status}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute top-3 left-3 pointer-events-none">
                                                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <textarea
                                                value={data.description}
                                                onChange={(e) =>
                                                    setData('description', e.target.value)
                                                }
                                                rows="3"
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                                required
                                            />
                                        </div>
                                        {errors.description && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* ─── PRODUCT GALLERY IMAGES ─── */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Gallery Images
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Shared photos that apply to the product line. Variant-specific images go below.
                                    </p>

                                    {existingImages.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500 mb-2">
                                                Current gallery images (click × to remove)
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                {existingImages.map((img) => (
                                                    <div
                                                        key={img.id}
                                                        className="relative group"
                                                    >
                                                        <img
                                                            src={`/storage/${img.path}`}
                                                            alt=""
                                                            className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                markImageForDeletion(img.id)
                                                            }
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                                                        >
                                                            ×
                                                        </button>
                                                        {img.is_primary && (
                                                            <span className="absolute bottom-0 left-0 bg-[#6F4E37] text-white text-[10px] px-1.5 py-0.5 rounded-tr-lg rounded-bl-lg">
                                                                Primary
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <label className="mt-3 inline-flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-3 hover:border-[#6F4E37] hover:bg-gray-100 transition">
                                        <PhotoIcon className="h-5 w-5 text-gray-500" />
                                        <span className="text-sm text-gray-600">
                                            {existingImages.length > 0
                                                ? 'Add more gallery images'
                                                : 'Upload gallery images'}
                                        </span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>

                                    {imagePreviews.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mt-3">
                                            {imagePreviews.map((preview, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={preview}
                                                        alt=""
                                                        className="h-20 w-20 object-cover rounded-lg border"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ─── PRODUCT VARIANTS ─── */}
                                <div>
                                    <div className="mb-3">
                                        <h3 className="text-base font-semibold text-gray-900">
                                            Product Variants
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Ordinary is the basic version. Standard costs more and has additional design details. Each variant has its own image.
                                        </p>
                                    </div>

                                    {data.variants.map((variant, vIdx) => {
                                        const isOrdinary = variant.slug === 'ordinary';
                                        const accent = isOrdinary
                                            ? {
                                                  bg: 'bg-stone-50',
                                                  border: 'border-stone-200',
                                                  badge: 'bg-stone-200 text-stone-700',
                                              }
                                            : {
                                                  bg: 'bg-amber-50',
                                                  border: 'border-amber-200',
                                                  badge: 'bg-amber-100 text-amber-800',
                                              };

                                        const newPreviews =
                                            variantImagePreviews[variant.slug] || [];
                                        const existing =
                                            existingVariantImages[variant.slug] || [];

                                        return (
                                            <div
                                                key={variant.slug}
                                                className={`${accent.bg} ${accent.border} border rounded-lg p-4 mb-3`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${accent.badge}`}
                                                        >
                                                            {variant.name}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {isOrdinary
                                                                ? 'Basic / cheaper'
                                                                : 'Upgraded / has extra details'}
                                                        </span>
                                                    </div>

                                                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={variant.is_active}
                                                            onChange={(e) => {
                                                                const newVariants = [
                                                                    ...data.variants,
                                                                ];
                                                                newVariants[
                                                                    vIdx
                                                                ].is_active =
                                                                    e.target.checked;
                                                                setData(
                                                                    'variants',
                                                                    newVariants
                                                                );
                                                            }}
                                                            className="h-3.5 w-3.5 rounded border-gray-300 text-[#6F4E37] focus:ring-[#6F4E37]"
                                                        />
                                                        Active
                                                    </label>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Price */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            Price{' '}
                                                            <span className="text-red-500">
                                                                *
                                                            </span>
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">
                                                                ₱
                                                            </span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={variant.price}
                                                                onChange={(e) => {
                                                                    const newVariants = [
                                                                        ...data.variants,
                                                                    ];
                                                                    newVariants[
                                                                        vIdx
                                                                    ].price =
                                                                        e.target.value;
                                                                    setData(
                                                                        'variants',
                                                                        newVariants
                                                                    );
                                                                }}
                                                                className="block w-full rounded-lg border-gray-200 bg-white pl-8 pr-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                                                placeholder={
                                                                    isOrdinary
                                                                        ? 'e.g. 500'
                                                                        : 'e.g. 800'
                                                                }
                                                            />
                                                        </div>
                                                        {errors[
                                                            `variants.${vIdx}.price`
                                                        ] && (
                                                            <p className="mt-1 text-xs text-red-600">
                                                                {
                                                                    errors[
                                                                        `variants.${vIdx}.price`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Image upload */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            {variant.name} Image
                                                        </label>
                                                        <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 hover:border-[#6F4E37] transition w-full">
                                                            <PhotoIcon className="h-4 w-4 text-gray-500" />
                                                            <span className="text-xs text-gray-600 truncate">
                                                                {variant.images?.length
                                                                    ? `${variant.images.length} new image(s) selected`
                                                                    : 'Upload image'}
                                                            </span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                onChange={(e) => {
                                                                    const files =
                                                                        Array.from(
                                                                            e.target
                                                                                .files || []
                                                                        );
                                                                    if (!files.length)
                                                                        return;
                                                                    handleVariantImageUpload(
                                                                        vIdx,
                                                                        files
                                                                    );
                                                                }}
                                                                className="hidden"
                                                            />
                                                        </label>

                                                        {existing.length > 0 && (
                                                            <div className="mt-2">
                                                                <p className="text-[10px] text-gray-500 mb-1">
                                                                    Current images:
                                                                </p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {existing.map((img) => (
                                                                        <div
                                                                            key={img.id}
                                                                            className="relative"
                                                                        >
                                                                            <img
                                                                                src={`/storage/${img.path}`}
                                                                                alt=""
                                                                                className="h-14 w-14 object-cover rounded border"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    markExistingVariantImageForDeletion(
                                                                                        vIdx,
                                                                                        img.id
                                                                                    )
                                                                                }
                                                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] leading-none"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {newPreviews.length > 0 && (
                                                            <div className="mt-2">
                                                                <p className="text-[10px] text-gray-500 mb-1">
                                                                    New uploads:
                                                                </p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {newPreviews.map(
                                                                        (preview, pi) => (
                                                                            <div
                                                                                key={pi}
                                                                                className="relative"
                                                                            >
                                                                                <img
                                                                                    src={
                                                                                        preview
                                                                                    }
                                                                                    alt=""
                                                                                    className="h-14 w-14 object-cover rounded border"
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        removeNewVariantImage(
                                                                                            vIdx,
                                                                                            pi
                                                                                        )
                                                                                    }
                                                                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] leading-none"
                                                                                >
                                                                                    ×
                                                                                </button>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Description */}
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            Design Details / Description
                                                        </label>
                                                        <textarea
                                                            rows={2}
                                                            value={variant.description}
                                                            onChange={(e) => {
                                                                const newVariants = [
                                                                    ...data.variants,
                                                                ];
                                                                newVariants[
                                                                    vIdx
                                                                ].description =
                                                                    e.target.value;
                                                                setData(
                                                                    'variants',
                                                                    newVariants
                                                                );
                                                            }}
                                                            className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] resize-none"
                                                            placeholder={
                                                                isOrdinary
                                                                    ? 'Simple build, no decorative detailing'
                                                                    : 'Extra detailing, premium joinery, thicker top, etc.'
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {errors.variants && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.variants}
                                        </p>
                                    )}
                                </div>

                                {/* ─── STANDARD DIMENSIONS (uses StandardSizeSelector) ─── */}
                                <StandardSizeSelector
                                    categoryId={data.category_id}
                                    templates={sizeTemplates}
                                    data={data}
                                    setData={setData}
                                    errors={errors}
                                    isCustomizable={data.is_customizable}
                                />

                                {/* ─── LABOR COST ─── */}
                                <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-lg">
                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-2">
                                        <WrenchScrewdriverIcon className="h-4 w-4 text-emerald-700" />
                                        <h3 className="text-sm font-semibold text-emerald-900">
                                            Labor Cost
                                        </h3>
                                        <span className="text-[10px] text-emerald-700">
                                            Internal cost — baked into the retail price. Snapshotted onto each order item when ordered.
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 max-w-md">
                                        <div>
                                            <label className="block text-[10px] font-medium text-stone-600 mb-0.5">
                                                Labor Cost (₱)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 text-xs">
                                                    ₱
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.labor_cost}
                                                    onChange={(e) =>
                                                        setData('labor_cost', e.target.value)
                                                    }
                                                    className="block w-full rounded-md border-gray-200 bg-white pl-6 pr-2 py-1 text-xs focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                                    placeholder="450"
                                                />
                                            </div>
                                            {errors.labor_cost && (
                                                <p className="mt-0.5 text-[10px] text-red-600">
                                                    {errors.labor_cost}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-medium text-stone-600 mb-0.5">
                                                Est. Hours
                                            </label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={data.estimated_labor_hours}
                                                onChange={(e) =>
                                                    setData(
                                                        'estimated_labor_hours',
                                                        e.target.value
                                                    )
                                                }
                                                className="block w-full rounded-md border-gray-200 bg-white px-2 py-1 text-xs focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                                placeholder="3"
                                            />
                                        </div>
                                    </div>

                                    {Number(data.labor_cost) > 0 && Number(data.price) > 0 && (
                                        <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[10px] text-stone-600">
                                            Retail ₱{Number(data.price).toFixed(2)} − Labor ₱
                                            {Number(data.labor_cost).toFixed(2)}{' '}
                                            →{' '}
                                            <span className="font-semibold text-emerald-800">
                                                ₱
                                                {(
                                                    Number(data.price) -
                                                    Number(data.labor_cost)
                                                ).toFixed(2)}
                                            </span>{' '}
                                            left for materials + margin
                                        </div>
                                    )}
                                </div>

                                {/* ─── BILL OF MATERIALS ─── */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-base font-semibold text-gray-900">
                                            Bill of Materials
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addMaterial}
                                            className="inline-flex items-center text-sm font-medium text-[#6F4E37] hover:text-[#5A3E2B]"
                                        >
                                            <PlusCircleIcon className="h-4 w-4 mr-1" />
                                            Add Material
                                        </button>
                                    </div>
                                    {data.materials.length === 0 && (
                                        <p className="text-sm text-gray-400">
                                            No materials defined. Add a material to build the BOM.
                                        </p>
                                    )}
                                    {data.materials.map((mat, idx) => (
                                        <div
                                            key={idx}
                                            className="flex flex-wrap items-center gap-2 mt-2 bg-gray-50/50 rounded-lg p-3 border border-gray-100"
                                        >
                                            <div className="flex-1 min-w-[120px]">
                                                <select
                                                    value={mat.id}
                                                    onChange={(e) =>
                                                        updateMaterial(idx, 'id', e.target.value)
                                                    }
                                                    className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm"
                                                >
                                                    <option value="">Select Material</option>
                                                    {materials.map((m) => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-20">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Qty"
                                                    value={mat.quantity}
                                                    onChange={(e) =>
                                                        updateMaterial(
                                                            idx,
                                                            'quantity',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div className="w-16">
                                                <input
                                                    type="text"
                                                    placeholder="Unit"
                                                    value={mat.unit}
                                                    onChange={(e) =>
                                                        updateMaterial(
                                                            idx,
                                                            'unit',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div className="w-56">
                                                <select
                                                    value={mat.calculation_rule || 'fixed'}
                                                    onChange={(e) => {
                                                        const rule = e.target.value;
                                                        updateMaterial(
                                                            idx,
                                                            'calculation_rule',
                                                            rule
                                                        );
                                                        if (
                                                            rule !==
                                                            'surface_area_coverage'
                                                        )
                                                            updateMaterial(
                                                                idx,
                                                                'coverage_rate',
                                                                ''
                                                            );
                                                        if (rule !== 'custom')
                                                            updateMaterial(
                                                                idx,
                                                                'formula',
                                                                ''
                                                            );
                                                    }}
                                                    className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm"
                                                >
                                                    <option value="fixed">Fixed</option>
                                                    <option value="board_feet">
                                                        Board Feet
                                                    </option>
                                                    <option value="surface_area_coverage">
                                                        Surface Area / Coverage
                                                    </option>
                                                    <option value="linear_feet">
                                                        Linear Feet
                                                    </option>
                                                    <option value="custom">
                                                        Custom (Advanced)
                                                    </option>
                                                </select>
                                            </div>
                                            {mat.calculation_rule ===
                                                'surface_area_coverage' && (
                                                <div className="w-24">
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        placeholder="Coverage"
                                                        value={mat.coverage_rate || ''}
                                                        onChange={(e) =>
                                                            updateMaterial(
                                                                idx,
                                                                'coverage_rate',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm"
                                                    />
                                                </div>
                                            )}
                                            {mat.calculation_rule === 'custom' && (
                                                <div className="w-48">
                                                    <input
                                                        type="text"
                                                        placeholder="Formula"
                                                        value={mat.formula || ''}
                                                        onChange={(e) =>
                                                            updateMaterial(
                                                                idx,
                                                                'formula',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm"
                                                    />
                                                </div>
                                            )}
                                            <label className="flex items-center text-sm whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={mat.is_finish || false}
                                                    onChange={(e) =>
                                                        updateMaterial(
                                                            idx,
                                                            'is_finish',
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="h-4 w-4 rounded border-gray-300 text-[#6F4E37] mr-1"
                                                />
                                                Finish
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => removeMaterial(idx)}
                                                className="text-red-400 hover:text-red-600 ml-1"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {errors.materials && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.materials}
                                        </p>
                                    )}
                                </div>

                                {/* ─── FURNITURE PARTS (customizable only) ─── */}
                                {data.is_customizable && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-base font-semibold text-gray-900">
                                                Furniture Parts
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={addPart}
                                                className="inline-flex items-center text-sm font-medium text-[#6F4E37] hover:text-[#5A3E2B]"
                                            >
                                                <PlusCircleIcon className="h-4 w-4 mr-1" />
                                                Add Part
                                            </button>
                                        </div>
                                        {data.parts.length === 0 && (
                                            <p className="text-sm text-gray-400">
                                                No parts defined. Add a part to allow customization.
                                            </p>
                                        )}
                                        {data.parts.map((part, partIdx) => {
                                            const currentPreset = detectPreset(
                                                part.dimension_fields
                                            );
                                            return (
                                                <div
                                                    key={partIdx}
                                                    className="bg-gray-50/50 rounded-lg border border-gray-100 p-4 mt-3"
                                                >
                                                    <div className="flex flex-wrap items-start gap-4">
                                                        <div className="flex-1 min-w-[200px]">
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                                Part Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={part.name}
                                                                onChange={(e) =>
                                                                    updatePart(
                                                                        partIdx,
                                                                        'name',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm"
                                                                placeholder="e.g. Table Top"
                                                            />
                                                        </div>
                                                        <div className="w-32">
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                                Sort Order
                                                            </label>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        movePart(
                                                                            partIdx,
                                                                            -1
                                                                        )
                                                                    }
                                                                    className="p-1 rounded hover:bg-gray-200"
                                                                    disabled={partIdx === 0}
                                                                >
                                                                    <ArrowUpIcon className="h-4 w-4 text-gray-500" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        movePart(
                                                                            partIdx,
                                                                            1
                                                                        )
                                                                    }
                                                                    className="p-1 rounded hover:bg-gray-200"
                                                                    disabled={
                                                                        partIdx ===
                                                                        data.parts
                                                                            .length -
                                                                            1
                                                                    }
                                                                >
                                                                    <ArrowDownIcon className="h-4 w-4 text-gray-500" />
                                                                </button>
                                                                <span className="text-sm text-gray-400 ml-1">
                                                                    {partIdx + 1}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removePart(partIdx)
                                                            }
                                                            className="text-red-400 hover:text-red-600 mt-6"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <div className="mt-3">
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                                            Reference Image
                                                        </label>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    if (
                                                                        e.target.files[0]
                                                                    )
                                                                        handlePartImageUpload(
                                                                            partIdx,
                                                                            e.target
                                                                                .files[0]
                                                                        );
                                                                }}
                                                                className="block text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                                            />
                                                            {(part.reference_image ||
                                                                partImagePreviews[partIdx]) && (
                                                                <div className="relative">
                                                                    <img
                                                                        src={
                                                                            partImagePreviews[
                                                                                partIdx
                                                                            ] ||
                                                                            part.reference_image
                                                                        }
                                                                        alt=""
                                                                        className="h-12 w-12 object-cover rounded border"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removePartImage(
                                                                                partIdx
                                                                            )
                                                                        }
                                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                                                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                                                            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                                                                Customer Input Fields
                                                            </label>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">
                                                                    Quick template:
                                                                </span>
                                                                <select
                                                                    value={currentPreset}
                                                                    onChange={(e) =>
                                                                        applyPreset(
                                                                            partIdx,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="text-xs rounded-md border-gray-200 bg-gray-50 px-2 py-1 focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                                                >
                                                                    {Object.entries(
                                                                        DIMENSION_PRESETS
                                                                    ).map(
                                                                        ([key, preset]) => (
                                                                            <option
                                                                                key={key}
                                                                                value={key}
                                                                            >
                                                                                {preset.label}
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {DIMENSION_FIELDS.map(
                                                                (field) => (
                                                                    <label
                                                                        key={field}
                                                                        className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition ${
                                                                            (
                                                                                part.dimension_fields ||
                                                                                []
                                                                            ).includes(
                                                                                field
                                                                            )
                                                                                ? 'bg-[#F5EDE8]/50'
                                                                                : 'hover:bg-gray-50'
                                                                        }`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={(
                                                                                part.dimension_fields ||
                                                                                []
                                                                            ).includes(
                                                                                field
                                                                            )}
                                                                            onChange={() =>
                                                                                toggleDimensionField(
                                                                                    partIdx,
                                                                                    field
                                                                                )
                                                                            }
                                                                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#6F4E37] focus:ring-[#6F4E37]"
                                                                        />
                                                                        <div className="min-w-0 flex-1">
                                                                            <span className="text-sm font-medium text-gray-800">
                                                                                {field}
                                                                            </span>
                                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                                {
                                                                                    DIMENSION_HELP[
                                                                                        field
                                                                                    ]
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </label>
                                                                )
                                                            )}
                                                        </div>

                                                        <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
                                                            <InformationCircleIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                                            <span>
                                                                Only checked fields appear in
                                                                the customer's customization
                                                                form. Leave Thickness unchecked
                                                                unless the customer needs to
                                                                choose it.
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {errors.parts && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.parts}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* ─── SUBMIT ─── */}
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] shadow-sm disabled:opacity-50"
                                    >
                                        <PencilIcon className="h-5 w-5 mr-2" />
                                        {processing ? 'Updating...' : 'Update Product'}
                                    </button>
                                    <Link
                                        href={route('admin.products.index')}
                                        className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                                    >
                                        <XMarkIcon className="h-5 w-5 mr-2" />
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
