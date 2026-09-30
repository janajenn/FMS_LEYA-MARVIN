import {
    XMarkIcon,
    CalculatorIcon,
    ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';

const formatPrice = (v) =>
    `₱${Number(v || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

/**
 * Trim trailing zeros so 18.00 shows as "18" and 18.50 shows as "18.5".
 */
const trimNumber = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return n % 1 === 0 ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
};

/**
 * Build per-part comparisons using:
 *   - item.product.parts  → each part's own standard_* values + dimension_fields
 *   - item.customization_data → the customer's actual inputs per part
 *
 * Returns an array of:
 *   {
 *     id, name,
 *     rows: [ { field, standard, actual, isBigger, isSmaller } ]
 *   }
 */
function buildPartComparisons(customizationData, productParts) {
    if (!customizationData || !Array.isArray(productParts) || !productParts.length) {
        return [];
    }

    // Normalise the customer's payload to { partId => { fieldKey: value } }
    let rawParts = {};

    if (
        customizationData.parts &&
        typeof customizationData.parts === 'object'
    ) {
        rawParts = customizationData.parts;
    } else {
        for (const [key, value] of Object.entries(customizationData)) {
            if (/^\d+$/.test(key) && value && typeof value === 'object') {
                rawParts[key] = value;
            }
        }
    }

    const comparisons = [];

    for (const [partId, dims] of Object.entries(rawParts)) {
        const part = productParts.find((p) => String(p.id) === String(partId));
        if (!part) continue;

        // Fields the admin marked as customizable on this part
        const fields = part.dimension_fields || [];
        if (!fields.length) continue;

        // Lowercase lookup of what the customer actually entered
        const actualByKey = {};
        for (const [k, v] of Object.entries(dims)) {
            actualByKey[k.toLowerCase()] = v;
        }

        const rows = fields.map((field) => {
            const key = field.toLowerCase();

            const standardRaw = part[`standard_${key}`];
            const actualRaw   = actualByKey[key];

            const standard = standardRaw === null || standardRaw === undefined || standardRaw === ''
                ? null
                : Number(standardRaw);

            const actual = actualRaw === null || actualRaw === undefined || actualRaw === ''
                ? null
                : Number(actualRaw);

            const isBigger  = actual !== null && standard !== null && actual > standard;
            const isSmaller = actual !== null && standard !== null && actual < standard;

            return { field, standard, actual, isBigger, isSmaller };
        });

        comparisons.push({
            id: part.id,
            name: part.name,
            rows,
        });
    }

    return comparisons;
}

export default function CustomizationBreakdownModal({ isOpen, onClose, item }) {
    if (!isOpen || !item) return null;

    const breakdown = item.customization_breakdown || [];
    const markup    = Number(item.markup_percent ?? 0);
    const storedSurcharge = Number(item.customization_surcharge ?? 0);

    // Sum of per-row extra material costs (fallback when the stored value is missing)
    const totalExtraMaterial =
        item.material_cost_diff != null
            ? Number(item.material_cost_diff)
            : breakdown.reduce((sum, row) => sum + Number(row.diff || 0), 0);

    const markupAmount = totalExtraMaterial * (markup / 100);

    // Per-part comparisons
    const partComparisons = buildPartComparisons(
        item.customization_data,
        item.product?.parts
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div
                    className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm"
                    onClick={onClose}
                />

                <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#F5EDE8] flex items-center justify-center">
                                <CalculatorIcon className="h-5 w-5 text-[#6F4E37]" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-stone-900">
                                    Customization Breakdown
                                </h2>
                                <p className="text-xs text-stone-500">
                                    {item.product?.name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-5">
                        {/* ── Per-part size comparison ── */}
                        {partComparisons.length > 0 && (
                            <div className="bg-[#F5EDE8]/50 border border-[#E8DCCF] rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <ArrowsPointingOutIcon className="h-4 w-4 text-[#6F4E37]" />
                                    <span className="text-sm font-semibold text-stone-800">
                                        Size Comparison
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {partComparisons.map((part) => (
                                        <div key={part.id}>
                                            <p className="text-[11px] font-semibold text-stone-700 uppercase tracking-wide mb-2">
                                                {part.name}
                                            </p>
                                            <div className="space-y-1.5">
                                                {part.rows.map((row) => (
                                                    <div
                                                        key={row.field}
                                                        className="flex items-center justify-between text-sm"
                                                    >
                                                        <span className="text-stone-600">
                                                            {row.field}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-stone-500 tabular-nums">
                                                                {trimNumber(row.standard) ?? '—'}″
                                                            </span>
                                                            <span className="text-stone-400">→</span>
                                                            <span
                                                                className={`font-semibold tabular-nums ${
                                                                    row.isBigger
                                                                        ? 'text-[#6F4E37]'
                                                                        : 'text-stone-700'
                                                                }`}
                                                            >
                                                                {trimNumber(row.actual) ?? '—'}″
                                                            </span>
                                                            {row.isBigger && (
                                                                <span className="text-[10px] font-semibold text-[#6F4E37] bg-[#6F4E37]/10 px-1.5 py-0.5 rounded tabular-nums">
                                                                    +
                                                                    {trimNumber(
                                                                        row.actual - row.standard
                                                                    )}
                                                                    ″
                                                                </span>
                                                            )}
                                                            {row.isSmaller && (
                                                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded tabular-nums">
                                                                    −
                                                                    {trimNumber(
                                                                        row.standard - row.actual
                                                                    )}
                                                                    ″
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs text-stone-500 mt-3 leading-relaxed">
                                    Your custom size uses more material than our standard
                                    size. The extra material cost is what drives the
                                    surcharge.
                                </p>
                            </div>
                        )}

                        {/* ── Material usage table ── */}
                        {breakdown.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-stone-800 mb-2">
                                    Material Usage
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-100">
                                                <th className="py-2 pr-3">Material</th>
                                                <th className="py-2 pr-3 text-right">Standard</th>
                                                <th className="py-2 pr-3 text-right">Your Order</th>
                                                <th className="py-2 text-right">Extra Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {breakdown.map((row) => (
                                                <tr key={row.material_id}>
                                                    <td className="py-2.5 pr-3 text-stone-800">
                                                        {row.name}
                                                        {row.unit && (
                                                            <span className="text-xs text-stone-400 ml-1">
                                                                ({row.unit})
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 pr-3 text-right text-stone-500 tabular-nums">
                                                        {Number(row.standard_qty || 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-2.5 pr-3 text-right text-stone-700 tabular-nums">
                                                        {Number(row.custom_qty || 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-2.5 text-right font-medium text-[#6F4E37] tabular-nums">
                                                        {Number(row.diff || 0) > 0
                                                            ? `+${formatPrice(row.diff)}`
                                                            : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                       <div className="bg-stone-50 rounded-lg p-4 space-y-2 text-sm">
    <div className="flex justify-between">
        <span className="text-stone-600">Extra material cost</span>
        <span className="font-medium text-stone-800">
            {formatPrice(totalExtraMaterial)}
        </span>
    </div>

    {markup > 0 && (
        <div className="flex justify-between">
            <span className="text-stone-600">Markup ({markup}%)</span>
            <span className="font-medium text-stone-800">
                {formatPrice(markupAmount)}
            </span>
        </div>
    )}

    {(() => {
        const raw = totalExtraMaterial + markupAmount;
        const wasCapped = storedSurcharge < raw - 0.01; // 1-cent tolerance
        return (
            <>
                {wasCapped && (
                    <div className="flex justify-between text-xs text-amber-700">
                        <span>Cap applied (max 5× base price)</span>
                        <span>−{formatPrice(raw - storedSurcharge)}</span>
                    </div>
                )}
                <div className="flex justify-between border-t border-stone-200 pt-2 mt-2">
                    <span className="font-semibold text-stone-900">
                        Customization Surcharge
                    </span>
                    <span className="font-bold text-[#6F4E37]">
                        {formatPrice(storedSurcharge)}
                    </span>
                </div>
            </>
        );
    })()}
</div>
                        {/* ── Explanation footer ── */}
                        <p className="text-xs text-stone-500 leading-relaxed">
                            This surcharge covers the extra material your custom size
                            requires. If you reduce your dimensions back to the standard
                            size, the surcharge will be removed automatically.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end px-6 py-4 bg-stone-50 border-t border-stone-100">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-[#6F4E37] text-white text-sm font-medium rounded-full hover:bg-[#5A3E2B] transition"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
