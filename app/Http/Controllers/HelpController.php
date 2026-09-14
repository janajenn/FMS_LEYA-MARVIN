<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Material;
use App\Services\MaterialCalculationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HelpController extends Controller
{
    public function materialCalculation()
    {
        $products = Product::where('is_customizable', true)
            ->with(['parts', 'materials'])
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'parts' => $product->parts->map(function ($part) {
                        return [
                            'id' => $part->id,
                            'name' => $part->name,
                            'dimension_fields' => $part->dimension_fields ?? ['Length', 'Width', 'Height'],
                        ];
                    }),
                    'materials' => $product->materials->map(function ($material) {
                        return [
                            'id' => $material->id,
                            'name' => $material->name,
                            'current_stock' => $material->stock_quantity,
                            'unit' => $material->unit,
                            'pivot' => [
                                'quantity' => $material->pivot->quantity,
                                'calculation_type' => $material->pivot->calculation_type,
                                'calculation_rule' => $material->pivot->calculation_rule,
                                'formula' => $material->pivot->formula,
                                'coverage_rate' => $material->pivot->coverage_rate,
                            ],
                        ];
                    }),
                ];
            });

        return Inertia::render('Help/MaterialCalculation', [
            'products' => $products,
        ]);
    }

    public function getProductData(Product $product)
    {
        $product->load(['parts', 'materials']);
        return response()->json([
            'parts' => $product->parts->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'dimension_fields' => $p->dimension_fields ?? ['Length', 'Width', 'Height'],
            ]),
            'materials' => $product->materials->map(fn($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'current_stock' => $m->stock_quantity,
                'unit' => $m->unit,
                'pivot' => $m->pivot,
            ]),
        ]);
    }

    public function simulate(Request $request, MaterialCalculationService $calculator)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'parts' => 'required|array',
            'parts.*.part_id' => 'required|exists:product_parts,id',
            'parts.*.dimensions' => 'required|array',
        ]);

        $product = Product::with(['materials', 'parts'])->findOrFail($request->product_id);
        $quantity = $request->quantity;
        $productParts = $product->parts->keyBy('id');

        $partsData = [];
        foreach ($request->parts as $part) {
            $partsData[$part['part_id']] = $part['dimensions'];
        }

        // Use the calculator to get requirements per material per part
        // We'll compute manually to capture per‑part details.
        $breakdown = []; // part_id => [material_id => ['quantity', 'calculation_detail']]

        foreach ($partsData as $partId => $dimensions) {
            $part = $productParts[$partId] ?? null;
            if (!$part) continue;

            $partBreakdown = [
                'part_name' => $part->name,
                'dimensions' => $dimensions,
                'materials' => [],
            ];

            foreach ($product->materials as $material) {
                $pivot = $material->pivot;
                $quantityPerUnit = 0;
                $calculationDetail = '';

                if ($pivot->calculation_type === 'fixed') {
                    $quantityPerUnit = (float) $pivot->quantity;
                    $calculationDetail = "Fixed quantity per unit: {$pivot->quantity} {$material->unit}";
                } elseif ($pivot->calculation_type === 'calculated') {
                    $calculationRule = $pivot->calculation_rule ?? 'custom';
                    $coverageRate = $pivot->coverage_rate ?? null;
                    $formula = $pivot->formula ?? '';

                    // If no valid rule, fallback to fixed quantity
                    if (empty($calculationRule) || ($calculationRule === 'custom' && empty($formula))) {
                        $quantityPerUnit = (float) $pivot->quantity;
                        $calculationDetail = "No calculation rule defined – using fixed quantity: {$pivot->quantity} {$material->unit}";
                    } else {
                        $l = (float) ($dimensions['length'] ?? 0);
                        $w = (float) ($dimensions['width'] ?? 0);
                        $h = (float) ($dimensions['height'] ?? 0);
                        $t = (float) ($dimensions['thickness'] ?? 0);

                        switch ($calculationRule) {
                            case 'board_feet':
                                $quantityPerUnit = ($l * $w * $t) / 144;
                                $calculationDetail = "Board feet formula: ({$l} × {$w} × {$t}) / 144 = " . number_format($quantityPerUnit, 4) . " BF";
                                break;
                            case 'surface_area':
                                $area = 2 * ($l * $w + $l * $h + $w * $h);
                                $quantityPerUnit = $area;
                                $calculationDetail = "Surface area: 2 × ({$l}×{$w} + {$l}×{$h} + {$w}×{$h}) = " . number_format($quantityPerUnit, 2) . " sq ft";
                                break;
                            case 'surface_area_coverage':
                                $area = 2 * ($l * $w + $l * $h + $w * $h);
                                $quantityPerUnit = $coverageRate ? $area / $coverageRate : 0;
                                $calculationDetail = "Surface area: {$area} sq ft / coverage rate {$coverageRate} = " . number_format($quantityPerUnit, 2) . " {$material->unit}";
                                break;
                            case 'linear_feet':
                                $quantityPerUnit = $l;
                                $calculationDetail = "Linear feet: length = {$l} ft";
                                break;
                            case 'custom':
                                // Use the calculator service to evaluate custom formula
                                $quantityPerUnit = $calculator->calculateQuantity($calculationRule, $dimensions, $coverageRate, $formula);
                                $calculationDetail = "Custom formula: {$formula} = " . number_format($quantityPerUnit, 2);
                                break;
                            default:
                                $quantityPerUnit = 0;
                                $calculationDetail = "Unrecognized rule, defaulting to 0";
                        }
                    }
                }

                $partBreakdown['materials'][$material->id] = [
                    'material_name' => $material->name,
                    'unit' => $material->unit,
                    'quantity_per_unit' => $quantityPerUnit,
                    'calculation_detail' => $calculationDetail,
                ];
            }

            $breakdown[$partId] = $partBreakdown;
        }

        // Now compute totals per material (sum across parts) and multiply by order quantity
        $totals = [];
        foreach ($breakdown as $partId => $partData) {
            foreach ($partData['materials'] as $materialId => $data) {
                $totals[$materialId] = ($totals[$materialId] ?? 0) + $data['quantity_per_unit'];
            }
        }

        // Multiply by order quantity
        foreach ($totals as $materialId => $qty) {
            $totals[$materialId] = $qty * $quantity;
        }

        // Prepare final response with totals and breakdown
        $result = [];
        foreach ($product->materials as $material) {
            $required = $totals[$material->id] ?? 0;
            $currentStock = $material->stock_quantity;
            $newStock = $currentStock - $required;
            $result[] = [
                'material_id' => $material->id,
                'name' => $material->name,
                'unit' => $material->unit,
                'required' => (float) $required,
                'current_stock' => (float) $currentStock,
                'new_stock' => (float) max(0, $newStock),
                'sufficient' => $newStock >= 0,
            ];
        }

        // Also send per‑part breakdown for the explanation
        return response()->json([
            'requirements' => $result,
            'breakdown' => $breakdown,
            'quantity' => $quantity,
            'product_name' => $product->name,
        ]);
    }
}
