import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
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
} from '@heroicons/react/24/outline';

const DIMENSION_FIELDS = ['Length', 'Width', 'Height', 'Thickness', 'Diameter', 'Depth'];

export default function Edit({ product, categories, materials, finishMaterials }) {
    const [existingImages, setExistingImages] = useState(product.images || []);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [partImagePreviews, setPartImagePreviews] = useState({});

    const { data, setData, put, processing, errors } = useForm({
        category_id: product.category_id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock_quantity: product.stock_quantity,
        is_customizable: product.is_customizable,
        status: product.status,
        images: [],
        delete_images: [],
       materials: product.materials?.map(m => ({
    id: m.id,
    quantity: m.pivot.quantity,
    unit: m.pivot.unit,
    calculation_rule: m.pivot.calculation_rule || 'fixed',
    coverage_rate: m.pivot.coverage_rate || '',
    formula: m.pivot.formula || '',
    is_finish: m.pivot.is_finish || false,
    sort_order: m.pivot.sort_order || 0,
})) || [],
        parts: product.parts?.map(p => ({
            id: p.id,
            name: p.name,
            reference_image: p.reference_image || '',
            dimension_fields: p.dimension_fields || [],
            sort_order: p.sort_order || 0,
        })) || [],
        // finishes: [] // REMOVED
    });

    // --- Product Images ---
    const markImageForDeletion = (imageId) => {
        setData('delete_images', [...data.delete_images, imageId]);
        setExistingImages(existingImages.filter(img => img.id !== imageId));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
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

    // --- Materials ---
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
        }
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

    // --- Parts ---
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
        if (fields.includes(field)) {
            newParts[partIdx].dimension_fields = fields.filter(f => f !== field);
        } else {
            newParts[partIdx].dimension_fields = [...fields, field];
        }
        setData('parts', newParts);
    };

    const handlePartImageUpload = (partIdx, file) => {
        const preview = URL.createObjectURL(file);
        setPartImagePreviews(prev => ({ ...prev, [partIdx]: preview }));
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
        newParts.forEach((p, i) => p.sort_order = i);
        setData('parts', newParts);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.products.update', product.id), {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Edit Product" />

            <div className="py-4">
                <div className="w-full">
                    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100/50">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Product</h1>
                                    <p className="mt-1 text-sm text-gray-500">Update product details</p>
                                </div>
                                <Link
                                    href={route('admin.products.index')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    <XMarkIcon className="h-5 w-5 mr-1.5" />
                                    Cancel
                                </Link>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Basic Info Grid – unchanged */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                onChange={e => setData('category_id', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors appearance-none"
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                        {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
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
                                                onChange={e => setData('name', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                placeholder="e.g. Ergonomic Office Chair"
                                                required
                                            />
                                        </div>
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Price <span className="text-red-500">*</span>
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
                                                onChange={e => setData('price', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Stock Quantity
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.stock_quantity}
                                            onChange={e => setData('stock_quantity', parseInt(e.target.value) || 0)}
                                            className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                            placeholder="0"
                                        />
                                        {errors.stock_quantity && <p className="mt-1 text-sm text-red-600">{errors.stock_quantity}</p>}
                                    </div>

                                    <div className="flex items-center space-x-3 pt-2">
                                        <input
                                            type="checkbox"
                                            id="is_customizable"
                                            checked={data.is_customizable}
                                            onChange={e => setData('is_customizable', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-[#6F4E37] focus:ring-[#6F4E37] focus:ring-offset-0"
                                        />
                                        <label htmlFor="is_customizable" className="text-sm text-gray-700 font-medium">
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
                                                onChange={e => setData('status', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors appearance-none"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                        {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
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
                                                onChange={e => setData('description', e.target.value)}
                                                rows="4"
                                                className="mt-1 block w-full rounded-lg border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                placeholder="Detailed product description..."
                                                required
                                            />
                                        </div>
                                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                    </div>
                                </div>

                                {/* Images */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Images
                                    </label>
                                    {existingImages.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500 mb-2">Current images (click × to remove)</p>
                                            <div className="flex flex-wrap gap-3">
                                                {existingImages.map(img => (
                                                    <div key={img.id} className="relative group">
                                                        <img
                                                            src={`/storage/${img.path}`}
                                                            alt=""
                                                            className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => markImageForDeletion(img.id)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
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
                                    <div className="mt-3">
                                        <div className="flex items-center">
                                            <label className="relative cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-4 hover:border-[#6F4E37] hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <PhotoIcon className="h-5 w-5" />
                                                    <span>Add new images</span>
                                                </div>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </label>
                                        </div>
                                        {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}
                                    </div>
                                    {imagePreviews.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mt-3">
                                            {imagePreviews.map((preview, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={preview}
                                                        alt={`Preview ${index}`}
                                                        className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ====== UNIFIED MATERIALS ====== */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-base font-semibold text-gray-900">Bill of Materials</h3>
                                        <button
                                            type="button"
                                            onClick={addMaterial}
                                            className="inline-flex items-center text-sm font-medium text-[#6F4E37] hover:text-[#5A3E2B] transition-colors"
                                        >
                                            <PlusCircleIcon className="h-4 w-4 mr-1" />
                                            Add Material
                                        </button>
                                    </div>
                                    {data.materials.length === 0 && (
                                        <p className="text-sm text-gray-400">No materials defined. Add a material to build the BOM.</p>
                                    )}
                                   {data.materials.map((mat, idx) => (
    <div key={idx} className="flex flex-wrap items-center gap-2 mt-2 bg-gray-50/50 rounded-lg p-3 border border-gray-100">
        {/* Material Select */}
        <div className="flex-1 min-w-[120px]">
            <select
                value={mat.id}
                onChange={e => updateMaterial(idx, 'id', e.target.value)}
                className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
            >
                <option value="">Select Material</option>
                {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </select>
        </div>

        {/* Quantity */}
        <div className="w-20">
            <input
                type="number"
                step="0.01"
                placeholder="Qty"
                value={mat.quantity}
                onChange={e => updateMaterial(idx, 'quantity', e.target.value)}
                className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
            />
        </div>

        {/* Unit */}
        <div className="w-16">
            <input
                type="text"
                placeholder="Unit"
                value={mat.unit}
                onChange={e => updateMaterial(idx, 'unit', e.target.value)}
                className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
            />
        </div>

        {/* Calculation Method Dropdown */}
        <div className="w-48">
            <select
                value={mat.calculation_rule || 'fixed'}
                onChange={e => {
                    const rule = e.target.value;
                    updateMaterial(idx, 'calculation_rule', rule);
                    // Reset conditional fields
                    if (rule !== 'surface_area_coverage') {
                        updateMaterial(idx, 'coverage_rate', '');
                    }
                    if (rule !== 'custom') {
                        updateMaterial(idx, 'formula', '');
                    }
                }}
                className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
            >
                <option value="fixed">Fixed</option>
                <option value="board_feet">Board Feet</option>
                <option value="surface_area">Surface Area</option>
                <option value="surface_area_coverage">Surface Area / Coverage</option>
                <option value="linear_feet">Linear Feet</option>
                <option value="custom">Custom (Advanced)</option>
            </select>
        </div>

        {/* Conditional: Coverage Rate (for surface_area_coverage) */}
        {mat.calculation_rule === 'surface_area_coverage' && (
            <div className="w-24">
                <input
                    type="number"
                    step="0.001"
                    placeholder="Coverage"
                    value={mat.coverage_rate || ''}
                    onChange={e => updateMaterial(idx, 'coverage_rate', e.target.value)}
                    className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                />
            </div>
        )}

        {/* Conditional: Formula (for custom) */}
        {mat.calculation_rule === 'custom' && (
            <div className="w-48">
                <input
                    type="text"
                    placeholder="Formula e.g. {length}*{width}*{thickness}/144"
                    value={mat.formula || ''}
                    onChange={e => updateMaterial(idx, 'formula', e.target.value)}
                    className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                />
            </div>
        )}

        {/* Is Finish checkbox */}
        <label className="flex items-center text-sm whitespace-nowrap">
            <input
                type="checkbox"
                checked={mat.is_finish || false}
                onChange={e => updateMaterial(idx, 'is_finish', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#6F4E37] focus:ring-[#6F4E37] mr-1"
            />
            Finish
        </label>

        {/* Remove button */}
        <button
            type="button"
            onClick={() => removeMaterial(idx)}
            className="text-red-400 hover:text-red-600 transition-colors ml-1"
        >
            <TrashIcon className="h-4 w-4" />
        </button>
    </div>
))}
                                    {errors.materials && <p className="mt-1 text-sm text-red-600">{errors.materials}</p>}
                                </div>

                                {/* ====== FURNITURE PARTS ====== */}
                                {data.is_customizable && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-base font-semibold text-gray-900">Furniture Parts</h3>
                                            <button
                                                type="button"
                                                onClick={addPart}
                                                className="inline-flex items-center text-sm font-medium text-[#6F4E37] hover:text-[#5A3E2B] transition-colors"
                                            >
                                                <PlusCircleIcon className="h-4 w-4 mr-1" />
                                                Add Part
                                            </button>
                                        </div>
                                        {data.parts.length === 0 && (
                                            <p className="text-sm text-gray-400">No parts defined. Add a part to allow customization.</p>
                                        )}
                                        {data.parts.map((part, partIdx) => (
                                            <div key={partIdx} className="bg-gray-50/50 rounded-lg border border-gray-100 p-4 mt-3">
                                                <div className="flex flex-wrap items-start gap-4">
                                                    <div className="flex-1 min-w-[200px]">
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Part Name</label>
                                                        <input
                                                            type="text"
                                                            value={part.name}
                                                            onChange={e => updatePart(partIdx, 'name', e.target.value)}
                                                            className="block w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] transition-colors"
                                                            placeholder="e.g. Table Top"
                                                        />
                                                    </div>
                                                    <div className="w-32">
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Sort Order</label>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => movePart(partIdx, -1)}
                                                                className="p-1 rounded hover:bg-gray-200"
                                                                disabled={partIdx === 0}
                                                            >
                                                                <ArrowUpIcon className="h-4 w-4 text-gray-500" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => movePart(partIdx, 1)}
                                                                className="p-1 rounded hover:bg-gray-200"
                                                                disabled={partIdx === data.parts.length - 1}
                                                            >
                                                                <ArrowDownIcon className="h-4 w-4 text-gray-500" />
                                                            </button>
                                                            <span className="text-sm text-gray-400 ml-1">{partIdx + 1}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePart(partIdx)}
                                                        className="text-red-400 hover:text-red-600 transition-colors mt-6"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                {/* Reference Image */}
                                                <div className="mt-3">
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Reference Image</label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files[0]) {
                                                                    handlePartImageUpload(partIdx, e.target.files[0]);
                                                                }
                                                            }}
                                                            className="block text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                                        />
                                                        {(part.reference_image || partImagePreviews[partIdx]) && (
                                                            <div className="relative">
                                                                <img
                                                                    src={partImagePreviews[partIdx] || part.reference_image}
                                                                    alt="Part preview"
                                                                    className="h-12 w-12 object-cover rounded border"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removePartImage(partIdx)}
                                                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Dimension Fields */}
                                                <div className="mt-3">
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Dimension Fields</label>
                                                    <div className="flex flex-wrap gap-3">
                                                        {DIMENSION_FIELDS.map((field) => (
                                                            <label key={field} className="inline-flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(part.dimension_fields || []).includes(field)}
                                                                    onChange={() => toggleDimensionField(partIdx, field)}
                                                                    className="h-4 w-4 rounded border-gray-300 text-[#6F4E37] focus:ring-[#6F4E37] focus:ring-offset-0"
                                                                />
                                                                <span className="ml-1 text-sm text-gray-600">{field}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {errors.parts && <p className="mt-1 text-sm text-red-600">{errors.parts}</p>}
                                    </div>
                                )}

                                {/* Form Actions */}
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-medium rounded-lg hover:bg-[#5A3E2B] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PencilIcon className="h-5 w-5 mr-2" />
                                        {processing ? 'Updating...' : 'Update Product'}
                                    </button>
                                    <Link
                                        href={route('admin.products.index')}
                                        className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
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
