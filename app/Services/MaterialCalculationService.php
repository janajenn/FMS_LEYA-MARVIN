<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Material;
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
     * Calculate material requirements for a customizable product
     * based on customer-entered dimensions for each part.
     *
     * @param Product $product
     * @param array $partsData  Structure: [part_id => ['length'=>..., 'width'=>..., ...]]
     * @return array  [material_id => total_quantity]
     */
   public function calculateRequirements(Product $product, array $partsData): array
{
    $requirements = [];
    $parts = $product->parts->keyBy('id');

    foreach ($partsData as $partId => $dimensions) {
        $part = $parts[$partId] ?? null;
        if (!$part) {
            continue;
        }

        foreach ($product->materials as $material) {
            $pivot = $material->pivot;
            $quantity = 0;

            if ($pivot->calculation_type === 'fixed') {
                $quantity = $pivot->quantity;
                Log::info('[MATERIAL_CALC] Fixed quantity used', [
                    'material' => $material->name,
                    'quantity' => $quantity,
                ]);
            } elseif ($pivot->calculation_type === 'calculated') {
                $calculationRule = $pivot->calculation_rule ?? '';
                $coverageRate = $pivot->coverage_rate ?? null;
                $formula = $pivot->formula ?? '';

                // ✅ FALLBACK: If no valid calculation rule, use fixed quantity
                if (empty($calculationRule) || ($calculationRule === 'custom' && empty($formula))) {
                    Log::warning('[MATERIAL_CALC] No valid calculation rule – using fixed quantity as fallback', [
                        'material' => $material->name,
                        'fixed_quantity' => $pivot->quantity,
                    ]);
                    $quantity = $pivot->quantity;
                } else {
                    $quantity = $this->calculateQuantity(
                        $calculationRule,
                        $dimensions,
                        $coverageRate,
                        $formula
                    );
                }
            }

            // Accumulate per material (sum across parts)
            $requirements[$material->id] = ($requirements[$material->id] ?? 0) + $quantity;
        }
    }

    return $requirements;
}

    /**
     * Calculate quantity based on the calculation rule.
     *
     * @param string $calculationRule
     * @param array $dimensions
     * @param float|null $coverageRate
     * @param string $formula
     * @return float
     */
    private function calculateQuantity(
        string $calculationRule,
        array $dimensions,
        ?float $coverageRate = null,
        string $formula = ''
    ): float {
        $l = $dimensions['length'] ?? 0;
        $w = $dimensions['width'] ?? 0;
        $h = $dimensions['height'] ?? 0;
        $t = $dimensions['thickness'] ?? 0;


        switch ($calculationRule) {
            case 'board_feet':
                return ($l * $w * $t) / 144;

            case 'surface_area':
                // For a rectangular box, total surface area
                return 2 * ($l * $w + $l * $h + $w * $h);

            case 'surface_area_coverage':
                // Area to cover divided by coverage rate (liters per sq ft)
                $area = 2 * ($l * $w + $l * $h + $w * $h);
                return $coverageRate ? $area / $coverageRate : 0;

            case 'linear_feet':
                return $l;

            case 'custom':
                return $this->evaluateFormula($formula, $dimensions);

            default:
                return 0;
        }
    }

    /**
     * Safely evaluate a custom formula with variables.
     *
     * @param string $formula
     * @param array $variables
     * @return float
     */
    private function evaluateFormula(string $formula, array $variables): float
    {
        // Replace {var} with $var
        $expr = str_replace(['{', '}'], ['$', ''], $formula);
        try {
            return (float) $this->expressionLanguage->evaluate($expr, $variables);
        } catch (\Exception $e) {
            Log::error('Formula evaluation failed', [
                'formula' => $formula,
                'variables' => $variables,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }
}
