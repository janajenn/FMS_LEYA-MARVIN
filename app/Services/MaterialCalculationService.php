<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Log;
use Symfony\Component\ExpressionLanguage\ExpressionLanguage;

class MaterialCalculationService
{
    protected ExpressionLanguage $expressionLanguage;

    public function __construct()
    {
        $this->expressionLanguage = new ExpressionLanguage();
    }

    /**
     * Calculate material requirements.
     *
     * @param  int|null $selectedMaterialId  If provided, only calculate for this specific material.
     */
    public function calculateRequirements(Product $product, array $partsData, ?int $selectedMaterialId = null): array
    {
        $requirements = [];
        $parts = $product->parts->keyBy('id');

        foreach ($product->materials as $material) {
            // NEW: Skip if we only want one specific material
            if ($selectedMaterialId && $material->id !== $selectedMaterialId) {
                continue;
            }

            $pivot = $material->pivot;
            $rule  = $pivot->calculation_rule ?? 'fixed';

            /* ─── Fixed Quantity ─── */
            if ($rule === 'fixed' || empty($rule)) {
                $requirements[$material->id] = (float) $pivot->quantity;
                continue;
            }

            /* ─── Board Feet ─── */
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
                continue;
            }

            /* ─── Linear Feet ─── */
            if ($rule === 'linear_feet') {
                $totalInches = 0.0;
                foreach ($partsData as $partId => $dimensions) {
                    if (!isset($parts[$partId])) continue;
                    $totalInches += (float) ($dimensions['length'] ?? 0);
                }
                $requirements[$material->id] = $totalInches / 12;
                continue;
            }

            /* ─── Custom Formula ─── */
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
        }

        return $requirements;
    }

    private function evaluateFormula(string $formula, array $variables): float
    {
        $expr = str_replace(['{', '}'], ['$', ''], $formula);
        try {
            return (float) $this->expressionLanguage->evaluate($expr, $variables);
        } catch (\Exception $e) {
            Log::error('Formula evaluation failed', ['formula' => $formula, 'error' => $e->getMessage()]);
            return 0;
        }
    }
}
