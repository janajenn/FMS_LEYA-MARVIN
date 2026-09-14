import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    CalculatorIcon,
    PlayIcon,
} from '@heroicons/react/24/outline';

export default function MaterialCalculation({ products }) {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productData, setProductData] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [dimensions, setDimensions] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedProduct) {
            setProductData(null);
            setDimensions({});
            setResult(null);
            return;
        }

        const fetchProductData = async () => {
            try {
                const response = await fetch(route('admin.help.product-data', selectedProduct));
                const data = await response.json();
                setProductData(data);
                const initialDims = {};
                data.parts.forEach(part => {
                    initialDims[part.id] = {};
                    part.dimension_fields.forEach(field => {
                        initialDims[part.id][field.toLowerCase()] = '';
                    });
                });
                setDimensions(initialDims);
                setResult(null);
            } catch (err) {
                console.error(err);
                setError('Failed to load product data.');
            }
        };
        fetchProductData();
    }, [selectedProduct]);

    const handleDimensionChange = (partId, field, value) => {
        setDimensions(prev => ({
            ...prev,
            [partId]: {
                ...prev[partId],
                [field]: value,
            },
        }));
    };

    const handleCalculate = async () => {
        if (!selectedProduct || !productData) return;

        const partsArray = productData.parts.map(part => {
            const dims = dimensions[part.id] || {};
            const filledDims = {};
            part.dimension_fields.forEach(field => {
                const fieldKey = field.toLowerCase();
                const val = dims[fieldKey];
                filledDims[fieldKey] = val !== undefined && val !== '' ? parseFloat(val) : 0;
            });
            return { part_id: part.id, dimensions: filledDims };
        });

        setLoading(true);
        setError(null);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
            const response = await fetch(route('admin.help.simulate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    product_id: selectedProduct,
                    quantity: quantity,
                    parts: partsArray,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setResult(data);
            } else {
                setError(data.message || 'Calculation failed.');
            }
        } catch (err) {
            console.error(err);
            setError('Network error or server issue.');
        }
        setLoading(false);
    };

    return (
        <AdminLayout>
            <Head title="How Material Calculation Works" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100">
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <CalculatorIcon className="h-7 w-7 text-[#6F4E37]" />
                                How Material Calculation Works
                            </h1>
                            <p className="text-gray-500 mt-1">
                                Understand how the system calculates and deducts raw materials when an order is placed.
                            </p>
                        </div>

                        {/* Explanation Section */}
                        <div className="p-6 border-b border-gray-200 bg-blue-50/30">
                            <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                                <CalculatorIcon className="h-5 w-5" />
                                How the Calculation Works
                            </h2>
                            <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                                <li>
                                    Each product has a <strong>Bill of Materials (BOM)</strong> that lists every raw material needed to produce one unit, along with how the quantity is determined (fixed or dimension‑based).
                                </li>
                                <li>
                                    For <strong>customizable</strong> products, the customer enters dimensions for each part. The system uses those dimensions and the BOM rules (like <code>board_feet</code> or <code>surface_area_coverage</code>) to compute the exact material requirement per part.
                                </li>
                                <li>
                                    If a material is marked as <strong>fixed</strong>, its quantity does not change – the system simply uses the preset value.
                                </li>
                                <li>
                                    The system then <strong>sums</strong> the requirements for the same material across all parts and multiplies by the <strong>order quantity</strong> to get the total needed.
                                </li>
                                <li>
                                    Finally, it compares the required amount with the <strong>current stock</strong> to show whether the inventory is sufficient.
                                </li>
                                <li>
                                    <span className="text-blue-600 font-medium">⚠️ This is a simulation</span> – no actual stock is deducted. You can safely test different dimensions and quantities to see how the calculation changes.
                                </li>
                            </ul>
                        </div>

                        {/* Interactive Simulator */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50/50">
                            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <PlayIcon className="h-6 w-6 text-[#6F4E37]" />
                                Try It Yourself
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Select a customizable product, enter dimensions, and see how the system calculates material requirements.
                                <span className="block text-xs text-blue-600 mt-0.5">This is a simulation only – no actual stock will be deducted.</span>
                            </p>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Select Product</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6F4E37] focus:ring focus:ring-[#6F4E37]/20"
                                        value={selectedProduct || ''}
                                        onChange={(e) => setSelectedProduct(e.target.value ? parseInt(e.target.value) : null)}
                                    >
                                        <option value="">-- Choose a product --</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {productData && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Order Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={quantity}
                                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-[#6F4E37] focus:ring focus:ring-[#6F4E37]/20"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-gray-700">Part Dimensions</label>
                                            {productData.parts.map((part) => (
                                                <div key={part.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                                    <h4 className="text-sm font-medium text-gray-800">{part.name}</h4>
                                                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                        {part.dimension_fields.map((field) => {
                                                            const fieldKey = field.toLowerCase();
                                                            return (
                                                                <div key={fieldKey}>
                                                                    <label className="block text-xs text-gray-500">{field}</label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={dimensions[part.id]?.[fieldKey] || ''}
                                                                        onChange={(e) => handleDimensionChange(part.id, fieldKey, e.target.value)}
                                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6F4E37] focus:ring focus:ring-[#6F4E37]/20 text-sm"
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={handleCalculate}
                                            disabled={loading}
                                            className="px-4 py-2 bg-[#6F4E37] text-white rounded-md hover:bg-[#5A3E2B] disabled:opacity-50 transition"
                                        >
                                            {loading ? 'Calculating...' : 'Calculate'}
                                        </button>

                                        {result && (
                                            <>
                                                {/* Results Table */}
                                                <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                                        <h3 className="font-medium text-gray-800">
                                                            Requirements for <span className="text-[#6F4E37]">{result.product_name}</span>
                                                            &nbsp;(Qty: {result.quantity})
                                                        </h3>
                                                    </div>
                                                    <div className="p-4 overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">New Stock (Simulated)</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {result.requirements.map((item) => (
                                                                    <tr key={item.material_id}>
                                                                        <td className="px-3 py-2 font-medium text-gray-800">{item.name}</td>
                                                                        <td className="px-3 py-2 text-gray-600">{item.unit || '—'}</td>
                                                                        <td className="px-3 py-2 font-medium">{Number(item.required).toFixed(2)}</td>
                                                                        <td className="px-3 py-2">{Number(item.current_stock).toFixed(2)}</td>
                                                                        <td className="px-3 py-2">{Number(item.new_stock).toFixed(2)}</td>
                                                                        <td className="px-3 py-2">
                                                                            {item.sufficient ? (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Sufficient</span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Insufficient</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 border-t border-gray-100">
                                                        ⚠️ Simulation only – no actual stock was deducted.
                                                    </div>
                                                </div>

                                                {/* Step‑by‑Step Explanation */}
                                                {result.breakdown && (
                                                    <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                                            <h3 className="font-medium text-gray-800">
                                                                Step‑by‑Step Calculation Explanation
                                                            </h3>
                                                            <p className="text-xs text-gray-500">How each material quantity was derived from your inputs.</p>
                                                        </div>
                                                        <div className="p-4 space-y-6">
                                                            {Object.entries(result.breakdown).map(([partId, partData]) => {
                                                                const part = productData.parts.find(p => p.id == partId);
                                                                const partName = part ? part.name : 'Part';
                                                                return (
                                                                    <div key={partId} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                                                        <h4 className="font-medium text-gray-700">{partName}</h4>
                                                                        <ul className="mt-2 text-sm text-gray-600 space-y-1">
                                                                            {Object.entries(partData.materials).map(([materialId, data]) => (
                                                                                <li key={materialId} className="pl-4 border-l-2 border-[#6F4E37]">
                                                                                    <span className="font-medium">{data.material_name}</span>:
                                                                                    {data.calculation_detail}
                                                                                    {' '}
                                                                                    <span className="text-xs text-gray-400">(per unit)</span>
                                                                                    {' → '}
                                                                                    <span className="font-medium text-[#6F4E37]">
                                                                                        {Number(data.quantity_per_unit).toFixed(4)} {data.unit}
                                                                                    </span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                );
                                                            })}
                                                            <div className="mt-2 text-xs text-gray-500">
                                                                <span className="font-medium">Final step:</span> Summed across all parts and multiplied by order quantity ({result.quantity}) to get the totals shown in the table above.
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {error && (
                                            <div className="mt-3 text-red-600 text-sm">{error}</div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
