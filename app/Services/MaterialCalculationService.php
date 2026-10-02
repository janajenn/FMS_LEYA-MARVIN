<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Log;
use Symfony\Component\ExpressionLanguage\ExpressionLanguage;

/**
 * ───────────────────────────────────────────────────────────────────────
 *  UNIT CONTRACT — single source of truth: config('units.dimension')
 * ───────────────────────────────────────────────────────────────────────
 *
 *  Every length / width / thickness / height / diameter / depth value
 *  passed in via $partsData is expressed in INCHES.
 *
 *  Derived units are computed here:
 *    board feet   = (T_in × W_in × L_in) / 144   → per part, summed
 *    linear feet  = L_in / 12                     → per part, summed
 *
 *  Do not change the storage unit without also updating:
 *    - config/units.php
 *    - resources/js/Pages/Admin/Products/{Create,Edit}.jsx
 *    - resources/js/Pages/Admin/Materials/{Create,Edit}.jsx
 *    - resources/js/Components/StandardSizeSelector.jsx
 */
class MaterialCalculationService
{
    protected ExpressionLanguage $expressionLanguage;

    public function __construct()
    {
        $this->expressionLanguage = new ExpressionLanguage();
    }

    /**
     * Calculate material requirements for a product.
     *
     * @param  Product $product
     * @param  array   $partsData  [part_id => ['length'=>..., 'width'=>..., 'height'=>..., 'thickness'=>...]]  — all in INCHES
     * @return array               [material_id => quantity_per_unit]
     */
    public function calculateRequirements(Product $product, array $partsData): array
    {
        $requirements = [];
        $parts = $product->parts->keyBy('id');

        foreach ($product->materials as $material) {
            $pivot = $material->pivot;
            $rule  = $pivot->calculation_rule ?? 'fixed';

            /* ─── Fixed Quantity ───
             * The admin enters how much material is used per product.
             * Used for finishes (varnish, paint, glue) and any other
             * material where the amount is known per piece.
             */
            if ($rule === 'fixed' || empty($rule)) {
                $requirements[$material->id] = (float) $pivot->quantity;

                Log::info('[MATERIAL_CALC] Fixed quantity', [
                    'material' => $material->name,
                    'quantity' => $pivot->quantity,
                ]);
                continue;
            }

            /* ─── Board Feet ───
             * Solid wood: (T × W × L) / 144, summed across all parts.
             * All three inputs are INCHES.
             */
           if ($rule === 'board_feet') {
    $materialThickness = (float) ($material->attributes['thickness'] ?? 0);
    $materialWidth     = (float) ($material->attributes['width']     ?? 0);

    $total = 0.0;
    foreach ($partsData as $partId => $dimensions) {
        if (!isset($parts[$partId])) continue;

        $t = $materialThickness > 0 ? $materialThickness : (float) ($dimensions['thickness'] ?? 0);
        $w = $materialWidth     > 0 ? $materialWidth     : (float) ($dimensions['width']     ?? 0);
        $l = (float) ($dimensions['length'] ?? 0);

        $total += ($l * $w * $t) / 144;
    }


                $requirements[$material->id] = $total;

                Log::info('[MATERIAL_CALC] Board feet', [
                    'material'   => $material->name,
                    'unit_input' => 'inches',
                    'board_feet' => $total,
                ]);
                continue;
            }

            /* ─── Linear Feet ───
             * Trim / molding: length is stored in INCHES, so we divide
             * by 12 to convert to linear feet before adding it up.
             */
            if ($rule === 'linear_feet') {
                $totalInches = 0.0;
                foreach ($partsData as $partId => $dimensions) {
                    if (!isset($parts[$partId])) continue;
                    $totalInches += (float) ($dimensions['length'] ?? 0); // inches
                }

                $requirements[$material->id] = $totalInches / 12;

                Log::info('[MATERIAL_CALC] Linear feet', [
                    'material'      => $material->name,
                    'length_inches' => $totalInches,
                    'linear_feet'   => $totalInches / 12,
                ]);
                continue;
            }

            /* ─── Custom Formula ───
             * Advanced users only. Runs per part. Variables are in inches.
             */
            if ($rule === 'custom' && !empty($pivot->formula)) {
                $total = 0.0;
                foreach ($partsData as $partId => $dimensions) {
                    if (!isset($parts[$partId])) continue;
                    $total += $this->evaluateFormula($pivot->formula, $dimensions);
                }
                $requirements[$material->id] = $total;
                continue;
            }

            /* ─── Fallback ─── */
            $requirements[$material->id] = (float) $pivot->quantity;

            Log::info('[MATERIAL_CALC] Fallback to fixed', [
                'material' => $material->name,
                'rule'     => $rule,
                'quantity' => $pivot->quantity,
            ]);
        }

        return $requirements;
    }

    /**
     * Safely evaluate a custom formula.
     * All variables passed in are in INCHES.
     */
    private function evaluateFormula(string $formula, array $variables): float
    {
        $expr = str_replace(['{', '}'], ['$', ''], $formula);
        try {
            return (float) $this->expressionLanguage->evaluate($expr, $variables);
        } catch (\Exception $e) {
            Log::error('Formula evaluation failed', [
                'formula'   => $formula,
                'variables' => $variables,
                'error'     => $e->getMessage(),
            ]);
            return 0;
        }
    }
}
