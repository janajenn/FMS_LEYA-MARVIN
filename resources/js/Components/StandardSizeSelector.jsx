import { useEffect, useRef } from 'react';
import { ArrowsPointingOutIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const STANDARD_DIMENSION_FIELDS = [
    { key: 'standard_length',    label: 'Length',    placeholder: '48', required: true },
    { key: 'standard_width',     label: 'Width',     placeholder: '24', required: true },
    { key: 'standard_height',    label: 'Height',    placeholder: '30', required: true },
    { key: 'standard_thickness', label: 'Thickness', placeholder: '1' },
    { key: 'standard_diameter',  label: 'Diameter',  placeholder: '—' },
    { key: 'standard_depth',     label: 'Depth',     placeholder: '—' },
];

/**
 * Renders either:
 *   - A strict dropdown of predefined size templates (when the category has them)
 *   - Free numeric inputs (when the category has no templates)
 *
 * All dimension values are entered and stored in INCHES — see config/units.php.
 */
export default function StandardSizeSelector({
    categoryId,
    templates,
    data,
    setData,
    errors,
    isCustomizable,
    units,
}) {
    // Fallbacks keep the component safe even if the controller didn't pass `units`.
    const unitShort = units?.dimensionShort || 'in';
    const unitFull  = units?.dimension       || 'inches';

    const categoryTemplates =
        templates?.[categoryId] ?? templates?.[String(categoryId)] ?? [];

    const hasTemplates = categoryTemplates.length > 0;

    const prevCategoryRef = useRef(categoryId);

    useEffect(() => {
        if (prevCategoryRef.current !== categoryId) {
            setData({
                ...data,
                standard_length: '',
                standard_width: '',
                standard_height: '',
                standard_thickness: '',
                standard_diameter: '',
                standard_depth: '',
            });
            prevCategoryRef.current = categoryId;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryId]);

    const findMatchingTemplate = () => {
        return categoryTemplates.find((t) => {
            const same = (a, b) => {
                const na = a === null || a === '' || a === undefined ? null : Number(a);
                const nb = b === null || b === '' || b === undefined ? null : Number(b);
                return na === nb;
            };
            return (
                same(t.length, data.standard_length) &&
                same(t.width, data.standard_width) &&
                same(t.height, data.standard_height) &&
                same(t.thickness, data.standard_thickness) &&
                same(t.diameter, data.standard_diameter) &&
                same(t.depth, data.standard_depth)
            );
        });
    };

    const selectedTemplate = hasTemplates ? findMatchingTemplate() : null;

    const handleTemplateSelect = (templateId) => {
        if (!templateId) {
            setData({
                ...data,
                standard_length: '',
                standard_width: '',
                standard_height: '',
                standard_thickness: '',
                standard_diameter: '',
                standard_depth: '',
            });
            return;
        }
        const t = categoryTemplates.find((x) => String(x.id) === String(templateId));
        if (!t) return;
        setData({
            ...data,
            standard_length:    t.length    ?? '',
            standard_width:     t.width     ?? '',
            standard_height:    t.height    ?? '',
            standard_thickness: t.thickness ?? '',
            standard_diameter:  t.diameter  ?? '',
            standard_depth:     t.depth     ?? '',
        });
    };

    /* ──────────────────────────────────────────────────────────
     * FALLBACK MODE — free inputs
     * ────────────────────────────────────────────────────────── */
    if (!hasTemplates) {
        return (
            <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-lg">
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-2">
                    <ArrowsPointingOutIcon className="h-4 w-4 text-amber-700" />
                    <h3 className="text-sm font-semibold text-amber-900">
                        Standard Dimensions
                    </h3>
                    <span className="text-[10px] text-amber-700">
                        Base price covers these. Larger sizes get a customization surcharge.
                        All values in <strong>{unitFull}</strong>.
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {STANDARD_DIMENSION_FIELDS.map((f) => (
                        <div key={f.key}>
                            <label className="block text-[10px] font-medium text-stone-600 mb-0.5">
                                {f.label}
                                <span className="ml-1 text-gray-400">({unitShort})</span>
                                {f.required && isCustomizable && (
                                    <span className="text-red-500"> *</span>
                                )}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data[f.key]}
                                    onChange={(e) => setData(f.key, e.target.value)}
                                    className="block w-full rounded-md border-gray-200 bg-white pl-2 pr-8 py-1 text-xs focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                                    placeholder={f.placeholder}
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-[10px] text-gray-400">
                                    {unitShort}
                                </span>
                            </div>
                            {errors[f.key] && (
                                <p className="mt-0.5 text-[10px] text-red-600">
                                    {errors[f.key]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <MarkupField data={data} setData={setData} errors={errors} />
            </div>
        );
    }

    /* ──────────────────────────────────────────────────────────
     * STRICT MODE — predefined size dropdown
     * ────────────────────────────────────────────────────────── */
    return (
        <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-lg">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-2">
                <ArrowsPointingOutIcon className="h-4 w-4 text-amber-700" />
                <h3 className="text-sm font-semibold text-amber-900">
                    Standard Size
                </h3>
                <span className="text-[10px] text-amber-700">
                    Fixed sizes for this category. Custom dimensions are not allowed.
                    All values in <strong>{unitFull}</strong>.
                </span>
            </div>

            <div className="max-w-md">
                <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="block w-full rounded-md border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                    required
                >
                    <option value="">— Select a size —</option>
                    {categoryTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.label} · {t.dimensions_summary}
                        </option>
                    ))}
                </select>
                {!selectedTemplate && (
                    <p className="mt-1 text-[10px] text-red-600">
                        Please select a standard size.
                    </p>
                )}
            </div>

            {/* Read-only preview — all values are in INCHES */}
            {selectedTemplate && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-md">
                    {[
                        ['Length',    selectedTemplate.length],
                        ['Width',     selectedTemplate.width],
                        ['Height',    selectedTemplate.height],
                        ['Thickness', selectedTemplate.thickness],
                        ['Diameter',  selectedTemplate.diameter],
                        ['Depth',     selectedTemplate.depth],
                    ]
                        .filter(([, v]) => v !== null && v !== '' && v !== undefined)
                        .map(([label, value]) => (
                            <div key={label}>
                                <p className="text-[10px] font-medium text-stone-500 uppercase">
                                    {label}
                                </p>
                                <p className="text-xs font-semibold text-stone-800">
                                    {value}
                                    <span className="ml-0.5 text-[10px] font-normal text-stone-500">
                                        {unitShort}
                                    </span>
                                </p>
                            </div>
                        ))}
                </div>
            )}

            <div className="mt-2 flex items-start gap-1.5 text-[10px] text-stone-500">
                <InformationCircleIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>
                    To add or change sizes for this category, go to{' '}
                    <strong>Admin → Standard Sizes</strong>.
                </span>
            </div>

            <MarkupField data={data} setData={setData} errors={errors} />
        </div>
    );
}

function MarkupField({ data, setData, errors }) {
    return (
        <div className="mt-2 flex items-center flex-wrap gap-2">
            <label className="text-[10px] font-medium text-stone-600">
                Customization Markup %
            </label>
            <input
                type="number"
                step="0.01"
                min="0"
                max="500"
                value={data.customization_markup_percent}
                onChange={(e) => setData('customization_markup_percent', e.target.value)}
                className="w-20 rounded-md border-gray-200 bg-white px-2 py-1 text-xs focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
                placeholder="40"
            />
            <span className="text-[10px] text-stone-500">
                Applied to extra material cost above standard.
            </span>
            {errors.customization_markup_percent && (
                <p className="text-[10px] text-red-600">
                    {errors.customization_markup_percent}
                </p>
            )}
        </div>
    );
}
