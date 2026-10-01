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
        'parts' => $product->parts->map(function ($p) {
            $fields = $p->dimension_fields ?? ['Length', 'Width', 'Height'];

            // Build { length: 48, width: 30, thickness: 1 } from standard_* columns
            $standards = [];
            foreach ($fields as $field) {
                $key = strtolower($field);
                $standards[$key] = $p->{'standard_' . $key} ?? null;
            }

            return [
                'id'               => $p->id,
                'name'             => $p->name,
                'dimension_fields' => $fields,
                'standards'        => $standards,   // ← NEW
            ];
        }),
        'materials' => $product->materials->map(fn ($m) => [
            'id'            => $m->id,
            'name'          => $m->name,
            'current_stock' => $m->stock_quantity,
            'unit'          => $m->unit,
            'pivot'         => $m->pivot,
        ]),
    ]);
}

   public function simulate(Request $request, MaterialCalculationService $calculator)
{
    $request->validate([
        'product_id'            => 'required|exists:products,id',
        'quantity'              => 'required|integer|min:1',
        'parts'                 => 'required|array',
        'parts.*.part_id'       => 'required|exists:product_parts,id',
        'parts.*.dimensions'    => 'present|array',
    ]);

    $product     = Product::with(['materials', 'parts'])->findOrFail($request->product_id);
    $quantity    = (int) $request->quantity;
    $productParts = $product->parts->keyBy('id');

    // ─── Resolve the effective dimensions per part ───
    // Custom value wins; otherwise fall back to the part's standard.
    $partsData = [];
    foreach ($request->parts as $part) {
        $partId    = $part['part_id'];
        $partModel = $productParts[$partId] ?? null;
        if (! $partModel) continue;

        $provided  = $part['dimensions'] ?? [];
        $fields    = $partModel->dimension_fields ?? ['Length', 'Width', 'Height'];

        $effective = [];
        foreach ($fields as $field) {
            $key   = strtolower($field);
            $value = $provided[$key] ?? null;

            // Treat null / '' / 0 as "not customized" → use standard
            if ($value === null || $value === '' || (float) $value === 0.0) {
                $value = $partModel->{'standard_' . $key} ?? 0;
            }

            $effective[$key] = (float) $value;
        }

        $partsData[$partId] = $effective;
    }

    // ─── Compute per-part breakdown ───
    $breakdown = [];
    foreach ($partsData as $partId => $dimensions) {
        $part = $productParts[$partId] ?? null;
        if (! $part) continue;

        $partBreakdown = [
            'part_name'  => $part->name,
            'dimensions' => $dimensions,
            'materials'  => [],
        ];

        foreach ($product->materials as $material) {
            $pivot             = $material->pivot;
            $quantityPerUnit   = 0.0;
            $calculationDetail = '';

            if ($pivot->calculation_type === 'fixed') {
                $quantityPerUnit   = (float) $pivot->quantity;
                $calculationDetail = "Fixed quantity per unit: {$pivot->quantity} {$material->unit}";
            } elseif ($pivot->calculation_type === 'calculated') {
                $calculationRule = $pivot->calculation_rule ?? 'custom';
                $coverageRate    = $pivot->coverage_rate ?? null;
                $formula         = $pivot->formula ?? '';

                if (empty($calculationRule) || ($calculationRule === 'custom' && empty($formula))) {
                    $quantityPerUnit   = (float) $pivot->quantity;
                    $calculationDetail = "No calculation rule defined – using fixed quantity: {$pivot->quantity} {$material->unit}";
                } else {
                    $l = (float) ($dimensions['length']    ?? 0);
                    $w = (float) ($dimensions['width']     ?? 0);
                    $h = (float) ($dimensions['height']    ?? 0);
                    $t = (float) ($dimensions['thickness'] ?? 0);

                    switch ($calculationRule) {
                        case 'board_feet':
                            $quantityPerUnit   = ($l * $w * $t) / 144;
                            $calculationDetail = "Board feet: ({$l} × {$w} × {$t}) / 144 = " . number_format($quantityPerUnit, 4) . " BF";
                            break;
                        case 'surface_area':
                            $area              = 2 * ($l * $w + $l * $h + $w * $h);
                            $quantityPerUnit   = $area;
                            $calculationDetail = "Surface area: 2 × ({$l}×{$w} + {$l}×{$h} + {$w}×{$h}) = " . number_format($area, 2) . " sq ft";
                            break;
                        case 'surface_area_coverage':
                            $area              = 2 * ($l * $w + $l * $h + $w * $h);
                            $quantityPerUnit   = $coverageRate ? $area / $coverageRate : 0;
                            $calculationDetail = "Surface area {$area} sq ft ÷ coverage {$coverageRate} = " . number_format($quantityPerUnit, 2) . " {$material->unit}";
                            break;
                        case 'linear_feet':
                            $quantityPerUnit   = $l;
                            $calculationDetail = "Linear feet: {$l} ft";
                            break;
                        case 'custom':
                            $quantityPerUnit   = $calculator->calculateQuantity($calculationRule, $dimensions, $coverageRate, $formula);
                            $calculationDetail = "Custom formula: {$formula} = " . number_format($quantityPerUnit, 2);
                            break;
                        default:
                            $quantityPerUnit   = 0.0;
                            $calculationDetail = 'Unrecognized rule, defaulting to 0';
                    }
                }
            }

            $partBreakdown['materials'][$material->id] = [
                'material_name'      => $material->name,
                'unit'               => $material->unit,
                'quantity_per_unit'  => $quantityPerUnit,
                'calculation_detail' => $calculationDetail,
            ];
        }

        $breakdown[$partId] = $partBreakdown;
    }

    // ─── Totals ───
    $totals = [];
    foreach ($breakdown as $partData) {
        foreach ($partData['materials'] as $materialId => $data) {
            $totals[$materialId] = ($totals[$materialId] ?? 0) + $data['quantity_per_unit'];
        }
    }
    foreach ($totals as $materialId => $qty) {
        $totals[$materialId] = $qty * $quantity;
    }

    $result = [];
    foreach ($product->materials as $material) {
        $required     = $totals[$material->id] ?? 0;
        $currentStock = (float) $material->stock_quantity;
        $newStock     = $currentStock - $required;

        $result[] = [
            'material_id'   => $material->id,
            'name'          => $material->name,
            'unit'          => $material->unit,
            'required'      => (float) $required,
            'current_stock' => $currentStock,
            'new_stock'     => (float) max(0, $newStock),
            'sufficient'    => $newStock >= 0,
        ];
    }

    return response()->json([
        'requirements' => $result,
        'breakdown'    => $breakdown,
        'quantity'     => $quantity,
        'product_name' => $product->name,
    ]);
}



}
