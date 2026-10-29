import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useRef } from 'react';
import {
    PlusIcon,
    XMarkIcon,
    TagIcon,
    DocumentTextIcon,
    CubeIcon,
    ChevronDownIcon,
    PlusCircleIcon,
    TrashIcon,
    PhotoIcon,
    WrenchScrewdriverIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ArrowsPointingOutIcon,
    AdjustmentsHorizontalIcon,
    Squares2X2Icon,
    BanknotesIcon, // <-- Added for pricing section
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import WoodTypePickerModal from '@/Components/WoodTypePickerModal';

/* ═══════════════════════════════════════════════════════════
 * Constants & Helpers
 * ═══════════════════════════════════════════════════════════ */

const DIMENSION_KEYS = [
    { key: 'length',    label: 'Length'    },
    { key: 'width',     label: 'Width'     },
    { key: 'height',    label: 'Height'    },
    { key: 'thickness', label: 'Thickness' },
    { key: 'diameter',  label: 'Diameter'  },
    { key: 'depth',     label: 'Depth'     },
];

const PRESETS = {
    custom:     { label: 'Custom',      fields: [] },
    table:      { label: 'Table',       fields: ['length', 'width', 'height'] },
    chair:      { label: 'Chair',       fields: ['width', 'depth', 'height'] },
    shelf:      { label: 'Shelf',       fields: ['width', 'height', 'depth'] },
    cabinet:    { label: 'Cabinet',     fields: ['width', 'height', 'depth'] },
    bed:        { label: 'Bed',         fields: ['length', 'width', 'height'] },
    bench:      { label: 'Bench',       fields: ['length', 'width', 'height'] },
    roundTable: { label: 'Round Table', fields: ['diameter', 'height'] },
    cushion:    { label: 'Cushion',     fields: ['length', 'width', 'thickness'] },
};

function detectPreset(fields) {
    const sorted = [...(fields || [])].sort().join(',');
    for (const [key, preset] of Object.entries(PRESETS)) {
        if (key === 'custom') continue;
        if ([...preset.fields].sort().join(',') === sorted) return key;
    }
    return 'custom';
}

const EMPTY_PART = {
    name: '',
    dimension_fields: [],
    is_customizable: false,
    dimension_bounds: {},
    dimension_pricing: {}, // <-- NEW
    allow_design_selection: false,
    standard_length: '',
    standard_width: '',
    standard_height: '',
    standard_thickness: '',
    standard_diameter: '',
    standard_depth: '',
    designs: [],
    sort_order: 0,
};

function getPartSummary(part) {
    if (!part.dimension_fields || part.dimension_fields.length === 0) {
        return 'No dimensions configured';
    }
    const parts = [];
    if (part.standard_length)    parts.push(`L ${part.standard_length}″`);
    if (part.standard_width)     parts.push(`W ${part.standard_width}″`);
    if (part.standard_height)    parts.push(`H ${part.standard_height}″`);
    if (part.standard_thickness) parts.push(`T ${part.standard_thickness}″`);
    if (part.standard_diameter)  parts.push(`Ø ${part.standard_diameter}″`);
    if (part.standard_depth)     parts.push(`D ${part.standard_depth}″`);
    return parts.length > 0 ? parts.join('  ·  ') : 'Fill in standard dimensions';
}

/* ═══════════════════════════════════════════════════════════
 * Reusable Sub-components
 * ═══════════════════════════════════════════════════════════ */

function Section({ icon: Icon, title, action, children }) {
    return (
        <div className="rounded-xl border border-stone-200/70 bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-stone-50/60 border-b border-stone-100">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="h-6 w-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-sm">
                        <Icon className="h-3.5 w-3.5 text-stone-600" />
                    </div>
                    <h4 className="text-xs font-semibold text-stone-800 truncate">{title}</h4>
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
            <div className="p-3">{children}</div>
        </div>
    );
}

function ToggleSwitch({ checked, onChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6F4E37]/40 focus-visible:ring-offset-1 ${
                checked ? 'bg-[#6F4E37]' : 'bg-stone-300'
            }`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    checked ? 'translate-x-5' : 'translate-x-0.5'
                }`}
            />
        </button>
    );
}

/* ═══════════════════════════════════════════════════════════
 * Main Component
 * ═══════════════════════════════════════════════════════════ */

export default function Create({ categories = [], woodMaterials = [], finishMaterials = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        category_id: '',
        name: '',
        description: '',
        stock_quantity: 0,
        status: 'active',
        standard_finish_surcharge: '',
        finish_material_id: '',
        variants: [],
        parts: [{ ...EMPTY_PART }],
    });

    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [woodPreviews, setWoodPreviews] = useState({});
    const [designPreviews, setDesignPreviews] = useState({});
    const [expandedParts, setExpandedParts] = useState({ 0: true });
    const partRefs = useRef([]);

    const alreadySelectedIds = data.variants.map((v) => v.material_id).filter(Boolean);

    /* ── Wood type handlers ── */

    const handleAddWoods = (materialIds) => {
        const next = [...data.variants];
        for (const id of materialIds) {
            const wood = woodMaterials.find((w) => w.id === id);
            if (!wood || next.some((v) => v.material_id === id)) continue;
            next.push({
                material_id: wood.id,
                name: wood.name,
                price: '',
                description: '',
                is_active: true,
                sort_order: next.length,
                images: [],
            });
        }
        setData('variants', next);
    };

    const removeWoodType = (idx) => {
        const next = [...data.variants];
        next.splice(idx, 1);
        setData('variants', next);
        const p = { ...woodPreviews };
        delete p[idx];
        setWoodPreviews(p);
    };

    const updateWoodType = (idx, field, value) => {
        const next = [...data.variants];
        next[idx][field] = value;
        setData('variants', next);
    };

    const handleWoodImages = (idx, files) => {
        const next = [...data.variants];
        next[idx].images = [...(next[idx].images || []), ...files];
        setData('variants', next);
        const p = { ...woodPreviews };
        p[idx] = [...(p[idx] || []), ...files.map((f) => URL.createObjectURL(f))];
        setWoodPreviews(p);
    };

    const removeWoodImage = (idx, imageIdx) => {
        const next = [...data.variants];
        next[idx].images.splice(imageIdx, 1);
        setData('variants', next);
        const p = { ...woodPreviews };
        p[idx] = [...(p[idx] || [])];
        p[idx].splice(imageIdx, 1);
        setWoodPreviews(p);
    };

    /* ── Part handlers ── */

    const togglePartExpand = (idx) => {
        setExpandedParts((prev) => ({ ...prev, [idx]: !prev[idx] }));
    };

    const addPart = () => {
        const newIndex = data.parts.length;
        setData('parts', [...data.parts, { ...EMPTY_PART, sort_order: newIndex }]);
        setExpandedParts((prev) => ({ ...prev, [newIndex]: true }));
        setTimeout(() => {
            partRefs.current[newIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }, 100);
    };

    const removePart = (idx) => {
        const next = [...data.parts];
        next.splice(idx, 1);
        setData('parts', next);

        const shift = (map) => {
            const out = {};
            Object.keys(map).forEach((k) => {
                const i = Number(k);
                if (i < idx) out[i] = map[k];
                else if (i > idx) out[i - 1] = map[k];
            });
            return out;
        };
        setExpandedParts(shift);
        setDesignPreviews(shift);
    };

    const updatePart = (idx, field, value) => {
        const next = [...data.parts];
        next[idx][field] = value;
        setData('parts', next);
    };

    const movePart = (idx, dir) => {
        const target = idx + dir;
        if (target < 0 || target >= data.parts.length) return;

        const next = [...data.parts];
        [next[idx], next[target]] = [next[target], next[idx]];
        next.forEach((p, i) => (p.sort_order = i));
        setData('parts', next);

        const swap = (map) => {
            const out = { ...map };
            [out[idx], out[target]] = [out[target], out[idx]];
            return out;
        };
        setExpandedParts(swap);
        setDesignPreviews(swap);
    };

    const toggleDimensionField = (idx, key) => {
        const next = [...data.parts];
        const fields = next[idx].dimension_fields || [];
        const isRemoving = fields.includes(key);

        next[idx].dimension_fields = isRemoving
            ? fields.filter((f) => f !== key)
            : [...fields, key];

        if (isRemoving) {
            next[idx][`standard_${key}`] = '';

            const b = { ...(next[idx].dimension_bounds || {}) };
            delete b[key];
            next[idx].dimension_bounds = b;

            const p = { ...(next[idx].dimension_pricing || {}) };
            delete p[key];
            next[idx].dimension_pricing = p;
        }
        setData('parts', next);
    };

    const applyPartPreset = (idx, presetKey) => {
        const preset = PRESETS[presetKey];
        if (!preset || presetKey === 'custom') return;
        const next = [...data.parts];
        next[idx].dimension_fields = [...preset.fields];
        setData('parts', next);
    };

    const updateBound = (partIdx, fieldKey, side, value) => {
        const next = [...data.parts];
        const bounds = { ...(next[partIdx].dimension_bounds || {}) };
        const current = bounds[fieldKey] || { min: '', max: '' };
        bounds[fieldKey] = { ...current, [side]: value };
        next[partIdx].dimension_bounds = bounds;
        setData('parts', next);
    };

    const updatePricing = (partIdx, fieldKey, value) => {
        const next = [...data.parts];
        const pricing = { ...(next[partIdx].dimension_pricing || {}) };
        pricing[fieldKey] = value;
        next[partIdx].dimension_pricing = pricing;
        setData('parts', next);
    };

    /* ── Design handlers ── */

    const addDesign = (partIdx) => {
        const next = [...data.parts];
        const designs = next[partIdx].designs || [];
        next[partIdx].designs = [
            ...designs,
            {
                name: '',
                image: null,
                additional_cost: 0,
                is_default: designs.length === 0,
                is_active: true,
                sort_order: designs.length,
            },
        ];
        setData('parts', next);
    };

    const removeDesign = (partIdx, designIdx) => {
        const next = [...data.parts];
        next[partIdx].designs.splice(designIdx, 1);

        if (next[partIdx].designs.length > 0 && !next[partIdx].designs.some((d) => d.is_default)) {
            next[partIdx].designs[0].is_default = true;
            next[partIdx].designs[0].additional_cost = 0;
        }
        setData('parts', next);

        const dp = { ...designPreviews };
        if (dp[partIdx]) {
            const shifted = {};
            Object.keys(dp[partIdx]).forEach((k) => {
                const i = Number(k);
                if (i < designIdx) shifted[i] = dp[partIdx][k];
                else if (i > designIdx) shifted[i - 1] = dp[partIdx][k];
            });
            dp[partIdx] = shifted;
        }
        setDesignPreviews(dp);
    };

    const updateDesign = (partIdx, designIdx, field, value) => {
        const next = [...data.parts];

        if (field === 'is_default' && value === true) {
            next[partIdx].designs.forEach((d, i) => {
                d.is_default = i === designIdx;
                if (i === designIdx) d.additional_cost = 0;
            });
        } else {
            next[partIdx].designs[designIdx][field] = value;
        }
        setData('parts', next);
    };

    const handleDesignImage = (partIdx, designIdx, file) => {
        const next = [...data.parts];
        next[partIdx].designs[designIdx].image = file;
        setData('parts', next);
        const dp = { ...designPreviews };
        dp[partIdx] = {
            ...(dp[partIdx] || {}),
            [designIdx]: URL.createObjectURL(file),
        };
        setDesignPreviews(dp);
    };

    /* ── Submit ── */

    const handleSubmit = (e) => {
        e.preventDefault();

        if (data.variants.length === 0) { alert('Please add at least one wood type.'); return; }
        for (const wt of data.variants) {
            if (wt.price === '' || wt.price === null) { alert(`Wood type "${wt.name}" needs a price.`); return; }
            if (!wt.images || wt.images.length === 0) { alert(`Please upload a finished-product photo for "${wt.name}".`); return; }
        }

        if (data.parts.length === 0) { alert('Please add at least one furniture part.'); return; }

        for (const part of data.parts) {
            if (!part.name || part.name.trim() === '') { alert('Every part needs a name.'); return; }

            for (const f of part.dimension_fields || []) {
                const key = `standard_${f}`;
                if (part[key] === '' || part[key] === null || part[key] === undefined) {
                    alert(`Please enter a standard ${f} for part "${part.name}".`); return;
                }
            }

            if (part.is_customizable) {
                for (const f of part.dimension_fields || []) {
                    const b = (part.dimension_bounds || {})[f] || {};
                    if (b.min === '' || b.max === '' || b.min === undefined || b.max === undefined) {
                        alert(`Set both min and max for "${f}" on part "${part.name}".`); return;
                    }
                    if (Number(b.min) > Number(b.max)) {
                        alert(`Min must be ≤ max for "${f}" on part "${part.name}".`); return;
                    }

                    const price = (part.dimension_pricing || {})[f];
                    if (price === '' || price === undefined || price === null || Number(price) < 0) {
                        alert(`Please set a valid Price per Inch for "${f}" on part "${part.name}".`); return;
                    }
                }
            }

            if (part.allow_design_selection) {
                if (!part.designs || part.designs.length === 0) {
                    alert(`Add at least one design for part "${part.name}".`); return;
                }
                for (const d of part.designs) {
                    if (!d.name || !d.name.trim()) {
                        alert(`Every design on part "${part.name}" needs a name.`); return;
                    }
                    if (!d.image && !d.existing_image_path) {
                        alert(`Design "${d.name}" on part "${part.name}" needs an image.`); return;
                    }
                    if (!d.is_default && (d.additional_cost === '' || d.additional_cost === null || Number(d.additional_cost) < 0)) {
                        alert(`Please enter a valid additional cost for design "${d.name}".`); return;
                    }
                }
            }
        }

        post(route('admin.products.store'), { forceFormData: true });
    };

    /* ═══════════════════════════════════════════════════════════
     * RENDER
     * ═══════════════════════════════════════════════════════════ */

    return (
        <AdminLayout>
            <Head title="Create Product" />

            <div className="py-4">
                <div className="w-full max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/70">
                        <div className="p-6 sm:p-8">
                            {/* Page header */}
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        Create Product
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Configure wood types, furniture parts, and the Ordinary / Standard option.
                                    </p>
                                </div>
                                <Link
                                    href={route('admin.products.index')}
                                    className="inline-flex items-center px-4 py-2 bg-white border border-stone-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
                                >
                                    <XMarkIcon className="h-4 w-4 mr-1.5" /> Cancel
                                </Link>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {errors.error && (
                                    <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 text-sm whitespace-pre-line">
                                        {errors.error}
                                    </div>
                                )}

                                {/* ── BASIC INFO ── */}
                                <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                                            Category <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                            <select
                                                value={data.category_id}
                                                onChange={(e) => setData('category_id', e.target.value)}
                                                className="block w-full rounded-lg border-stone-200 bg-stone-50/60 pl-9 pr-10 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10 appearance-none transition-shadow"
                                                required
                                            >
                                                <option value="">Select category</option>
                                                {categories.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                                            Product Name <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <CubeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="block w-full rounded-lg border-stone-200 bg-stone-50/60 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10 transition-shadow"
                                                placeholder="e.g. Dining Chair"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                                            Stock Quantity
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.stock_quantity}
                                            onChange={(e) => setData('stock_quantity', parseInt(e.target.value) || 0)}
                                            className="block w-full rounded-lg border-stone-200 bg-stone-50/60 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10 transition-shadow tabular-nums"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                                            Status
                                        </label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="block w-full rounded-lg border-stone-200 bg-stone-50/60 px-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10 transition-shadow"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                                            Description
                                        </label>
                                        <div className="relative">
                                            <DocumentTextIcon className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                                            <textarea
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                rows="2"
                                                className="block w-full rounded-lg border-stone-200 bg-stone-50/60 pl-9 pr-4 py-2.5 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10 transition-shadow resize-none"
                                                placeholder="Optional product description..."
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* ── ORDINARY / STANDARD ── */}
                                <section className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/60 to-amber-50/20 p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                                            <WrenchScrewdriverIcon className="h-4 w-4 text-amber-700" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-semibold text-amber-900">
                                                Ordinary / Standard Option
                                            </h2>
                                            <p className="text-[11px] text-amber-800/70">
                                                Standard adds a finish for an extra charge, offered to the customer for every wood type.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-medium text-stone-700 mb-1.5">
                                                Extra charge for Standard <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">₱</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.standard_finish_surcharge}
                                                    onChange={(e) => setData('standard_finish_surcharge', e.target.value)}
                                                    className="block w-full rounded-lg border-stone-200 bg-white pl-8 pr-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10 transition-shadow tabular-nums"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-stone-700 mb-1.5">
                                                Finish / Varnish Material
                                            </label>
                                            <select
                                                value={data.finish_material_id}
                                                onChange={(e) => setData('finish_material_id', e.target.value)}
                                                className="block w-full rounded-lg border-stone-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10 transition-shadow"
                                            >
                                                <option value="">— None —</option>
                                                {finishMaterials.map((f) => (
                                                    <option key={f.id} value={f.id}>
                                                        {f.name} (₱{f.cost}/{f.unit})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {/* ── WOOD TYPES ── */}
                                <section>
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-base font-semibold text-gray-900">
                                                    Wood Types
                                                </h2>
                                                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#6F4E37]/10 text-[11px] font-semibold text-[#6F4E37] tabular-nums">
                                                    {data.variants.length}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                Each wood type has its own price and finished-product photo.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsPickerOpen(true)}
                                            className="inline-flex items-center px-3 py-1.5 bg-[#6F4E37] text-white text-xs font-semibold rounded-lg hover:bg-[#5A3E2B] shadow-sm shadow-[#6F4E37]/20 transition-all"
                                        >
                                            <PlusCircleIcon className="h-3.5 w-3.5 mr-1" /> Browse Woods
                                        </button>
                                    </div>

                                    {data.variants.length === 0 && (
                                        <div className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/40 px-6 py-6 text-center">
                                            <CubeIcon className="h-8 w-8 mx-auto text-stone-300" />
                                            <p className="mt-2 text-xs text-stone-500">
                                                No wood types yet. Click <strong className="text-stone-700">Browse Woods</strong> to add.
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {data.variants.map((wt, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-xl border border-stone-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-center justify-between px-3 py-2 bg-stone-50/70 border-b border-stone-100">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide bg-stone-800 text-white">
                                                        {wt.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeWoodType(idx)}
                                                        className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                    >
                                                        <TrashIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-stone-600 mb-1">
                                                            Selling Price <span className="text-rose-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">₱</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={wt.price}
                                                                onChange={(e) => updateWoodType(idx, 'price', e.target.value)}
                                                                className="w-full rounded-lg border-stone-200 bg-stone-50/50 pl-6 pr-2 py-1.5 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10 tabular-nums"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-stone-600 mb-1">
                                                            Product Photo <span className="text-rose-500">*</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-stone-300 bg-stone-50/40 px-2.5 py-1.5 hover:border-[#6F4E37] hover:bg-stone-50 transition-colors">
                                                            <PhotoIcon className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                                            <span className="text-[11px] text-stone-600 truncate">
                                                                {wt.images?.length
                                                                    ? `${wt.images.length} photo(s) selected`
                                                                    : 'Upload'}
                                                            </span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                onChange={(e) => {
                                                                    const files = Array.from(e.target.files || []);
                                                                    if (files.length) handleWoodImages(idx, files);
                                                                }}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        {(woodPreviews[idx] || []).length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                {(woodPreviews[idx] || []).map((p, pi) => (
                                                                    <div key={pi} className="relative group/img">
                                                                        <img
                                                                            src={p}
                                                                            alt=""
                                                                            className="h-10 w-10 object-cover rounded-md border border-stone-200"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeWoodImage(idx, pi)}
                                                                            className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-3.5 h-3.5 text-[9px] leading-none opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* ═══════════════════════════════════════════
                                    FURNITURE PARTS — Premium Accordion
                                ═══════════════════════════════════════════ */}
                                <section>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-base font-semibold text-gray-900">
                                                    Furniture Parts
                                                </h2>
                                                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#6F4E37]/10 text-[11px] font-semibold text-[#6F4E37] tabular-nums">
                                                    {data.parts.length}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                Set standard sizes, customization range, and design options — values in inches.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addPart}
                                            className="inline-flex items-center px-3 py-1.5 bg-[#6F4E37] text-white text-xs font-semibold rounded-lg hover:bg-[#5A3E2B] shadow-sm shadow-[#6F4E37]/20 transition-all"
                                        >
                                            <PlusIcon className="h-3.5 w-3.5 mr-1" /> Add Part
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {data.parts.map((part, partIdx) => {
                                            const isExpanded = !!expandedParts[partIdx];
                                            const currentPreset = detectPreset(part.dimension_fields);
                                            const dimCount = (part.dimension_fields || []).length;
                                            const designCount = (part.designs || []).length;

                                            return (
                                                <div
                                                    key={partIdx}
                                                    ref={(el) => (partRefs.current[partIdx] = el)}
                                                    className={`group relative bg-white rounded-2xl border transition-all duration-300 ${
                                                        isExpanded
                                                            ? 'border-[#6F4E37]/40 shadow-lg shadow-[#6F4E37]/5'
                                                            : 'border-stone-200 shadow-sm hover:border-stone-300 hover:shadow-md'
                                                    }`}
                                                >
                                                    {/* Left accent bar */}
                                                    <div
                                                        className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-300 ${
                                                            isExpanded
                                                                ? 'bg-[#6F4E37]'
                                                                : 'bg-transparent group-hover:bg-stone-200'
                                                        }`}
                                                    />

                                                    {/* ─── Collapsed Header ─── */}
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePartExpand(partIdx)}
                                                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                                                    >
                                                        <div
                                                            className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center font-semibold text-sm transition-colors tabular-nums ${
                                                                isExpanded
                                                                    ? 'bg-[#6F4E37] text-white shadow-sm shadow-[#6F4E37]/30'
                                                                    : 'bg-stone-100 text-stone-600 group-hover:bg-stone-200'
                                                            }`}
                                                        >
                                                            {partIdx + 1}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                                                <h3 className="text-sm font-semibold text-stone-900 truncate">
                                                                    {part.name || 'Unnamed part'}
                                                                </h3>
                                                                {part.is_customizable && (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                                                        <AdjustmentsHorizontalIcon className="h-2.5 w-2.5" />
                                                                        Custom
                                                                    </span>
                                                                )}
                                                                {part.allow_design_selection && (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                                                                        <Squares2X2Icon className="h-2.5 w-2.5" />
                                                                        {designCount} design{designCount === 1 ? '' : 's'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-stone-500 truncate tabular-nums">
                                                                {getPartSummary(part)}
                                                            </p>
                                                        </div>

                                                        <div className="shrink-0 flex items-center gap-1">
                                                            <div className="flex items-center gap-0.5 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); movePart(partIdx, -1); }}
                                                                    disabled={partIdx === 0}
                                                                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                                                    title="Move up"
                                                                >
                                                                    <ArrowUpIcon className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); movePart(partIdx, 1); }}
                                                                    disabled={partIdx === data.parts.length - 1}
                                                                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                                                    title="Move down"
                                                                >
                                                                    <ArrowDownIcon className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); removePart(partIdx); }}
                                                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                                title="Delete part"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                            <div
                                                                className={`p-1 rounded-lg transition-all duration-300 ${
                                                                    isExpanded ? 'bg-[#6F4E37]/10' : 'bg-transparent'
                                                                }`}
                                                            >
                                                                <ChevronDownIcon
                                                                    className={`h-4 w-4 transition-all duration-300 ${
                                                                        isExpanded ? 'rotate-180 text-[#6F4E37]' : 'text-stone-400'
                                                                    }`}
                                                                />
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {/* ─── Expanded Body (smooth grid transition) ─── */}
                                                    <div
                                                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                                                            isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                                        }`}
                                                    >
                                                        <div className="overflow-hidden min-h-0">
                                                            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-stone-100">
                                                                {/* Part name */}
                                                                <div>
                                                                    <label className="block text-[11px] font-medium text-stone-600 mb-1.5">
                                                                        Part name <span className="text-rose-500">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={part.name}
                                                                        onChange={(e) => updatePart(partIdx, 'name', e.target.value)}
                                                                        className="w-full rounded-lg border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10 transition-shadow"
                                                                        placeholder="e.g. Seat, Legs, Backrest"
                                                                    />
                                                                </div>

                                                                {/* ─── Dimensions ─── */}
                                                                <Section
                                                                    icon={ArrowsPointingOutIcon}
                                                                    title="Dimensions"
                                                                    action={
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-[10px] text-stone-400">Preset</span>
                                                                            <select
                                                                                value={currentPreset}
                                                                                onChange={(e) => applyPartPreset(partIdx, e.target.value)}
                                                                                className="text-[11px] rounded-md border-stone-200 bg-white px-2 py-1 focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10"
                                                                            >
                                                                                {Object.entries(PRESETS).map(([k, p]) => (
                                                                                    <option key={k} value={k}>{p.label}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    }
                                                                >
                                                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                                                        {DIMENSION_KEYS.map((d) => {
                                                                            const on = (part.dimension_fields || []).includes(d.key);
                                                                            return (
                                                                                <button
                                                                                    key={d.key}
                                                                                    type="button"
                                                                                    onClick={() => toggleDimensionField(partIdx, d.key)}
                                                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                                                                        on
                                                                                            ? 'bg-[#6F4E37] text-white border-[#6F4E37] shadow-sm shadow-[#6F4E37]/20'
                                                                                            : 'bg-white text-stone-600 border-stone-200 hover:border-[#6F4E37]/40 hover:text-stone-900'
                                                                                    }`}
                                                                                >
                                                                                    {d.label}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>

                                                                    {dimCount > 0 && (
                                                                        <div>
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                                                                                    Standard size
                                                                                </p>
                                                                                <span className="text-[10px] text-stone-400">in inches</span>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                                                                {(part.dimension_fields || []).map((f) => {
                                                                                    const label =
                                                                                        DIMENSION_KEYS.find((d) => d.key === f)?.label || f;
                                                                                    return (
                                                                                        <div
                                                                                            key={f}
                                                                                            className="rounded-lg border border-stone-200 bg-white overflow-hidden focus-within:border-[#6F4E37] focus-within:ring-2 focus-within:ring-[#6F4E37]/10 transition-shadow"
                                                                                        >
                                                                                            <div className="px-2 pt-1.5 text-[10px] font-medium text-stone-500">
                                                                                                {label}
                                                                                            </div>
                                                                                            <div className="flex items-baseline">
                                                                                                <input
                                                                                                    type="number"
                                                                                                    step="0.01"
                                                                                                    min="0"
                                                                                                    value={part[`standard_${f}`] ?? ''}
                                                                                                    onChange={(e) =>
                                                                                                        updatePart(partIdx, `standard_${f}`, e.target.value)
                                                                                                    }
                                                                                                    className="flex-1 w-full min-w-0 border-0 bg-transparent px-2 pb-1.5 text-sm font-semibold text-stone-900 focus:ring-0 focus:outline-none tabular-nums"
                                                                                                    placeholder="0"
                                                                                                />
                                                                                                <span className="pr-2 pb-1.5 text-[10px] text-stone-400">
                                                                                                    in
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Section>

                                                                {/* ─── Customization & Pricing ─── */}
                                                                <Section
                                                                    icon={AdjustmentsHorizontalIcon}
                                                                    title="Dimension customization"
                                                                    action={
                                                                        <ToggleSwitch
                                                                            checked={part.is_customizable}
                                                                            onChange={(v) => updatePart(partIdx, 'is_customizable', v)}
                                                                        />
                                                                    }
                                                                >
                                                                    {part.is_customizable ? (
                                                                        <>
                                                                            <p className="text-xs text-stone-500 mb-3">
                                                                                Customers can adjust enabled dimensions within these ranges. Additional cost is calculated per inch of increase.
                                                                            </p>
                                                                            {dimCount === 0 ? (
                                                                                <p className="text-xs text-stone-400 italic">
                                                                                    Enable at least one dimension above first.
                                                                                </p>
                                                                            ) : (
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                                    {(part.dimension_fields || []).map((f) => {
                                                                                        const label =
                                                                                            DIMENSION_KEYS.find((d) => d.key === f)?.label || f;
                                                                                        const b = (part.dimension_bounds || {})[f] || {};
                                                                                        const price = (part.dimension_pricing || {})[f] || '';

                                                                                        return (
                                                                                            <div
                                                                                                key={f}
                                                                                                className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-white p-2.5"
                                                                                            >
                                                                                                <span className="text-xs font-semibold text-stone-800">
                                                                                                    {label}
                                                                                                </span>

                                                                                                {/* Bounds Row */}
                                                                                                <div className="flex items-center gap-1.5">
                                                                                                    <div className="flex-1 rounded-md bg-stone-50 px-1.5 py-1 flex items-baseline gap-0.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#6F4E37]/20 transition-shadow border border-stone-100">
                                                                                                        <span className="text-[9px] text-stone-400 shrink-0 font-medium">Min</span>
                                                                                                        <input
                                                                                                            type="number"
                                                                                                            step="0.01"
                                                                                                            min="0"
                                                                                                            value={b.min ?? ''}
                                                                                                            onChange={(e) => updateBound(partIdx, f, 'min', e.target.value)}
                                                                                                            className="w-full min-w-0 border-0 bg-transparent px-0.5 py-0 text-xs font-medium text-stone-800 focus:ring-0 focus:outline-none tabular-nums"
                                                                                                            placeholder="—"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <span className="text-stone-300 text-xs">—</span>
                                                                                                    <div className="flex-1 rounded-md bg-stone-50 px-1.5 py-1 flex items-baseline gap-0.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#6F4E37]/20 transition-shadow border border-stone-100">
                                                                                                        <span className="text-[9px] text-stone-400 shrink-0 font-medium">Max</span>
                                                                                                        <input
                                                                                                            type="number"
                                                                                                            step="0.01"
                                                                                                            min="0"
                                                                                                            value={b.max ?? ''}
                                                                                                            onChange={(e) => updateBound(partIdx, f, 'max', e.target.value)}
                                                                                                            className="w-full min-w-0 border-0 bg-transparent px-0.5 py-0 text-xs font-medium text-stone-800 focus:ring-0 focus:outline-none tabular-nums"
                                                                                                            placeholder="—"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>

                                                                                                {/* Pricing Rule Row */}
                                                                                                <div className="flex items-center justify-between bg-emerald-50/50 rounded-md px-2 py-1.5 border border-emerald-100/50">
                                                                                                    <span className="text-[10px] font-medium text-emerald-800 flex items-center gap-1">
                                                                                                        <BanknotesIcon className="h-3 w-3" />
                                                                                                        Price / inch
                                                                                                    </span>
                                                                                                    <div className="flex items-center bg-white rounded border border-emerald-200 px-1.5 py-0.5 focus-within:ring-1 focus-within:ring-emerald-400">
                                                                                                        <span className="text-[10px] text-emerald-600 mr-0.5">₱</span>
                                                                                                        <input
                                                                                                            type="number"
                                                                                                            min="0"
                                                                                                            step="0.01"
                                                                                                            value={price}
                                                                                                            onChange={(e) => updatePricing(partIdx, f, e.target.value)}
                                                                                                            className="w-12 border-0 bg-transparent px-0 py-0 text-[11px] text-right font-bold text-emerald-900 focus:ring-0 focus:outline-none tabular-nums"
                                                                                                            placeholder="0.00"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-xs text-stone-400 italic">
                                                                            Customers will use the standard sizes as-is.
                                                                        </p>
                                                                    )}
                                                                </Section>

                                                                {/* ─── Designs ─── */}
                                                                <Section
                                                                    icon={Squares2X2Icon}
                                                                    title="Design options"
                                                                    action={
                                                                        <div className="flex items-center gap-2">
                                                                            {part.allow_design_selection && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => addDesign(partIdx)}
                                                                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6F4E37] hover:text-[#5A3E2B] px-2 py-1 rounded-md hover:bg-[#6F4E37]/5 transition-colors"
                                                                                >
                                                                                    <PlusIcon className="h-3 w-3" />
                                                                                    Add
                                                                                </button>
                                                                            )}
                                                                            <ToggleSwitch
                                                                                checked={part.allow_design_selection}
                                                                                onChange={(v) =>
                                                                                    updatePart(partIdx, 'allow_design_selection', v)
                                                                                }
                                                                            />
                                                                        </div>
                                                                    }
                                                                >
                                                                    {part.allow_design_selection ? (
                                                                        designCount === 0 ? (
                                                                            <div className="rounded-xl border-2 border-dashed border-stone-200 bg-white px-4 py-6 text-center">
                                                                                <Squares2X2Icon className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                                                                                <p className="text-xs text-stone-500 mb-2">
                                                                                    No designs yet
                                                                                </p>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => addDesign(partIdx)}
                                                                                    className="inline-flex items-center gap-1 text-xs font-medium text-[#6F4E37] hover:text-[#5A3E2B]"
                                                                                >
                                                                                    <PlusIcon className="h-3.5 w-3.5" />
                                                                                    Add first design
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                                                {(part.designs || []).map((design, dIdx) => {
                                                                                    const preview =
                                                                                        designPreviews[partIdx]?.[dIdx] ||
                                                                                        design.existing_image_url ||
                                                                                        null;

                                                                                    return (
                                                                                        <div
                                                                                            key={dIdx}
                                                                                            className={`relative rounded-xl overflow-hidden bg-white border transition-all ${
                                                                                                design.is_default
                                                                                                    ? 'border-[#6F4E37] ring-1 ring-[#6F4E37]/20'
                                                                                                    : 'border-stone-200 hover:shadow-md'
                                                                                            }`}
                                                                                        >
                                                                                            <label className="block aspect-[4/3] bg-stone-100 cursor-pointer relative group/img">
                                                                                                {preview ? (
                                                                                                    <img
                                                                                                        src={preview}
                                                                                                        alt={design.name}
                                                                                                        className="w-full h-full object-cover"
                                                                                                    />
                                                                                                ) : (
                                                                                                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-1">
                                                                                                        <PhotoIcon className="h-6 w-6" />
                                                                                                        <span className="text-[10px]">Upload</span>
                                                                                                    </div>
                                                                                                )}
                                                                                                <input
                                                                                                    type="file"
                                                                                                    hidden
                                                                                                    accept="image/*"
                                                                                                    onChange={(e) => {
                                                                                                        const f = e.target.files?.[0];
                                                                                                        if (f) handleDesignImage(partIdx, dIdx, f);
                                                                                                    }}
                                                                                                />

                                                                                                {design.is_default && (
                                                                                                    <div className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#6F4E37] text-white text-[9px] font-semibold shadow-sm">
                                                                                                        <StarIcon className="h-2.5 w-2.5" />
                                                                                                        Default
                                                                                                    </div>
                                                                                                )}

                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={(e) => {
                                                                                                        e.preventDefault();
                                                                                                        removeDesign(partIdx, dIdx);
                                                                                                    }}
                                                                                                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/95 text-stone-500 hover:text-rose-600 opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm"
                                                                                                >
                                                                                                    <XMarkIcon className="h-3 w-3" />
                                                                                                </button>
                                                                                            </label>

                                                                                            <div className="p-2.5 space-y-2">
                                                                                                <input
                                                                                                    type="text"
                                                                                                    value={design.name}
                                                                                                    onChange={(e) =>
                                                                                                        updateDesign(partIdx, dIdx, 'name', e.target.value)
                                                                                                    }
                                                                                                    placeholder="Design name"
                                                                                                    className="w-full border-0 bg-transparent px-0 py-0 text-xs font-semibold text-stone-800 focus:ring-0 focus:outline-none placeholder:text-stone-400 placeholder:font-normal"
                                                                                                />

                                                                                                <div>
                                                                                                    {design.is_default ? (
                                                                                                        <div className="flex items-center justify-between text-[11px] px-2 py-1.5 bg-stone-50 rounded-md border border-stone-100">
                                                                                                            <span className="text-stone-500 font-medium">Add. Cost</span>
                                                                                                            <span className="font-semibold text-emerald-600">Included</span>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <div className="flex items-center justify-between bg-stone-50 rounded-md border border-stone-200 px-2 py-1 focus-within:border-[#6F4E37] focus-within:ring-1 focus-within:ring-[#6F4E37]/20 transition-shadow">
                                                                                                            <span className="text-[10px] font-medium text-stone-500">Add. Cost</span>
                                                                                                            <div className="flex items-center">
                                                                                                                <span className="text-[11px] text-stone-400 mr-0.5">₱</span>
                                                                                                                <input
                                                                                                                    type="number"
                                                                                                                    min="0"
                                                                                                                    step="0.01"
                                                                                                                    value={design.additional_cost ?? 0}
                                                                                                                    onChange={(e) => updateDesign(partIdx, dIdx, 'additional_cost', e.target.value)}
                                                                                                                    className="w-16 border-0 bg-transparent px-0 py-0 text-xs text-right font-semibold text-stone-800 focus:ring-0 focus:outline-none tabular-nums"
                                                                                                                    placeholder="0.00"
                                                                                                                />
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>

                                                                                                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => updateDesign(partIdx, dIdx, 'is_default', true)}
                                                                                                        disabled={design.is_default}
                                                                                                        className={`text-[10px] font-medium transition-colors ${
                                                                                                            design.is_default
                                                                                                                ? 'text-[#6F4E37] cursor-default'
                                                                                                                : 'text-stone-500 hover:text-[#6F4E37]'
                                                                                                        }`}
                                                                                                    >
                                                                                                        {design.is_default ? 'Default Selected' : 'Make Default'}
                                                                                                    </button>
                                                                                                    <label className="flex items-center gap-1 text-[10px] text-stone-500 cursor-pointer">
                                                                                                        <input
                                                                                                            type="checkbox"
                                                                                                            checked={design.is_active !== false}
                                                                                                            onChange={(e) => updateDesign(partIdx, dIdx, 'is_active', e.target.checked)}
                                                                                                            className="h-2.5 w-2.5 rounded border-stone-300 text-[#6F4E37] focus:ring-0"
                                                                                                        />
                                                                                                        Active
                                                                                                    </label>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )
                                                                    ) : (
                                                                        <p className="text-xs text-stone-400 italic">
                                                                            Customers won't be able to select a design for this part.
                                                                        </p>
                                                                    )}
                                                                </Section>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* ── SUBMIT ── */}
                                <div className="flex flex-wrap gap-3 pt-5 border-t border-stone-100">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-5 py-2.5 bg-[#6F4E37] text-white text-sm font-semibold rounded-lg hover:bg-[#5A3E2B] shadow-sm shadow-[#6F4E37]/20 disabled:opacity-50 transition-all"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-2" />
                                        {processing ? 'Creating...' : 'Create Product'}
                                    </button>
                                    <Link
                                        href={route('admin.products.index')}
                                        className="inline-flex items-center px-5 py-2.5 bg-white border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
                                    >
                                        <XMarkIcon className="h-4 w-4 mr-2" /> Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <WoodTypePickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                woods={woodMaterials}
                alreadySelectedIds={alreadySelectedIds}
                onConfirm={handleAddWoods}
            />
        </AdminLayout>
    );
}
