<?php

namespace App\Http\Controllers;

use App\Models\Product;
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
                    'id'   => $product->id,
                    'name' => $product->name,
                    'parts' => $product->parts->map(function ($part) {
                        return [
                            'id'               => $part->id,
                            'name'             => $part->name,
                            'dimension_fields' => $part->dimension_fields ?? ['Length', 'Width', 'Height'],
                        ];
                    }),
                    'materials' => $product->materials->map(function ($material) {
                        return [
                            'id'            => $material->id,
                            'name'          => $material->name,
                            'current_stock' => $material->stock_quantity,
                            'unit'          => $material->unit,
                            'pivot' => [
                                'quantity'         => $material->pivot->quantity,
                                'calculation_type' => $material->pivot->calculation_type,
                                'calculation_rule' => $material->pivot->calculation_rule,
                                'formula'          => $material->pivot->formula,
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
                    'standards'        => $standards,
                ];
            }),
            'materials' => $product->materials->map(fn ($m) => [
                'id'            => $m->id,
                'name'          => $m->name,
                'current_stock' => $m->stock_quantity,
                'unit'          => $m->unit,
                'pivot'         => [
                    'quantity'         => $m->pivot->quantity,
                    'calculation_type' => $m->pivot->calculation_type,
                    'calculation_rule' => $m->pivot->calculation_rule,
                    'formula'          => $m->pivot->formula,
                ],
            ]),
        ]);
    }

    public function simulate(Request $request, MaterialCalculationService $calculator)
    {
        $request->validate([
            'product_id'         => 'required|exists:products,id',
            'quantity'           => 'required|integer|min:1',
            'parts'              => 'required|array',
            'parts.*.part_id'    => 'required|exists:product_parts,id',
            'parts.*.dimensions' => 'present|array',
        ]);

        $product      = Product::with(['materials', 'parts'])->findOrFail($request->product_id);
        $quantity     = (int) $request->quantity;
        $productParts = $product->parts->keyBy('id');

        // ─── Resolve effective dimensions per part ───
        // Custom value wins; otherwise fall back to the part's standard.
        $partsData = [];
        foreach ($request->parts as $part) {
            $partId    = $part['part_id'];
            $partModel = $productParts[$partId] ?? null;
            if (! $partModel) continue;

            $provided = $part['dimensions'] ?? [];
            $fields   = $partModel->dimension_fields ?? ['Length', 'Width', 'Height'];

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

        // ─── Per-part breakdown via MaterialCalculationService ───
        // The service sums across all parts it's given; feed it one part
        // at a time so we can show per-part numbers.
        $breakdown = [];
        foreach ($partsData as $partId => $dimensions) {
            $part = $productParts[$partId] ?? null;
            if (! $part) continue;

            $perPart = $calculator->calculateRequirements($product, [$partId => $dimensions]);

            $partBreakdown = [
                'part_name'  => $part->name,
                'dimensions' => $dimensions,
                'materials'  => [],
            ];

            foreach ($product->materials as $material) {
                $qty = $perPart[$material->id] ?? 0.0;

                $partBreakdown['materials'][$material->id] = [
                    'material_name'      => $material->name,
                    'unit'               => $material->unit,
                    'quantity_per_unit'  => $qty,
                    'calculation_detail' => $this->describeCalculation($material, $dimensions, $qty),
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

    /**
     * Human-readable description of how a material quantity was derived.
     * Purely cosmetic — the actual number comes from the service.
     */
    private function describeCalculation($material, array $dims, float $qty): string
    {
        $rule = $material->pivot->calculation_rule ?? 'fixed';
        $unit = $material->unit ?? '';

        switch ($rule) {
            case 'board_feet': {
                $l = $dims['length']    ?? 0;
                $w = $dims['width']     ?? 0;
                $t = $dims['thickness'] ?? 0;
                return "Board feet: ({$l} × {$w} × {$t}) / 144 = "
                    . number_format($qty, 4) . " BF";
            }
            case 'linear_feet': {
                $l = $dims['length'] ?? 0;
                return "Linear feet: {$l} ft";
            }
            case 'custom':
                return "Custom formula: {$material->pivot->formula} = "
                    . number_format($qty, 4);
            case 'fixed':
            default:
                return "Fixed quantity per unit: {$qty} {$unit}";
        }
    }
}
