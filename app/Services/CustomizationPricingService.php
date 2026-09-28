<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Log;

class CustomizationPricingService
{
    protected MaterialCalculationService $calculator;

    /**
     * Hard cap multiplier: surcharge can't exceed this multiple of base price.
     * Prevents runaway surcharges on absurd dimensions.
     */
    protected float $maxSurchargeMultiplier = 5.0;

    public function __construct(MaterialCalculationService $calculator)
    {
        $this->calculator = $calculator;
    }

    /**
     * Calculate the customization surcharge for a product + customer dimensions.
     *
     * @param  Product $product       The product (must have `parts` and `materials` loaded)
     * @param  array   $partsData     Raw customization_data from the cart (any format)
     * @param  int     $quantity      Order quantity
     * @return array   Detailed breakdown — see below
     */
    /**
 * Calculate the customization surcharge for a product + customer dimensions.
 *
 * @param  Product $product       The product (must have `parts` and `materials` loaded)
 * @param  array   $partsData     Raw customization_data from the cart (any format)
 * @param  int     $quantity      Order quantity
 * @return array   Detailed breakdown
 */
public function calculateSurcharge(Product $product, array $partsData, int $quantity = 1): array
{
    // ── Guard: non-customizable products never have a surcharge ──
    if (!$product->is_customizable) {
        return $this->emptyResult('product_not_customizable');
    }

    // ── Guard: standard dimensions must be set ──
    // At minimum, we need length, width, AND height to compute a baseline.
    if (
        $product->standard_length === null &&
        $product->standard_width === null &&
        $product->standard_height === null
    ) {
        return $this->emptyResult('no_standard_dimensions');
    }

    // ── Normalize parts data (handle both nested and flat formats) ──
    $normalizedParts = $this->normalizePartsData($partsData);

    if (empty($normalizedParts)) {
        return $this->emptyResult('no_parts_data');
    }

    // ── Ensure relations are loaded ──
    $product->loadMissing(['parts', 'materials']);

    if ($product->materials->isEmpty()) {
        return $this->emptyResult('no_materials');
    }

    // ── Fallback values from the product's standard dimensions ──
    // These are used whenever the customer didn't provide a dimension
    // (because the admin didn't enable it for that part). This keeps the
    // comparison apples-to-apples so the diff reflects only what the
    // customer actually changed.
    $fallbacks = [
        'length'    => (float) ($product->standard_length    ?? 0),
        'width'     => (float) ($product->standard_width     ?? 0),
        'height'    => (float) ($product->standard_height    ?? 0),
        'thickness' => (float) ($product->standard_thickness ?? 1.0),
        'diameter'  => (float) ($product->standard_diameter  ?? 0),
        'depth'     => (float) ($product->standard_depth     ?? 0),
    ];

    // Fill missing/zero dimensions with the standard fallback
    foreach ($normalizedParts as $partId => &$dims) {
        foreach ($fallbacks as $dim => $fallbackValue) {
            if (!isset($dims[$dim]) || $dims[$dim] === 0.0) {
                $dims[$dim] = $fallbackValue;
            }
        }
    }
    unset($dims);

    // ── Build standard parts data (same dims for every part) ──
    $standardParts = $this->buildStandardPartsData($product);

    // ── Compute material requirements for both sizes ──
    $standardReqs = $this->calculator->calculateRequirements($product, $standardParts);
    $customReqs   = $this->calculator->calculateRequirements($product, $normalizedParts);

    // ── Compute total material cost for both sizes ──
    $breakdown    = [];
    $standardCost = 0.0;
    $customCost   = 0.0;

    foreach ($product->materials as $material) {
        $unitCost = (float) ($material->cost ?? 0);

        $standardQty = (float) ($standardReqs[$material->id] ?? 0);
        $customQty   = (float) ($customReqs[$material->id] ?? 0);

        $standardLine = $standardQty * $unitCost;
        $customLine   = $customQty   * $unitCost;

        $standardCost += $standardLine;
        $customCost   += $customLine;

        $breakdown[] = [
            'material_id'   => $material->id,
            'name'          => $material->name,
            'unit'          => $material->unit,
            'unit_cost'     => round($unitCost, 2),
            'standard_qty'  => round($standardQty, 4),
            'custom_qty'    => round($customQty, 4),
            'standard_cost' => round($standardLine, 2),
            'custom_cost'   => round($customLine, 2),
            'diff'          => round($customLine - $standardLine, 2),
        ];
    }

    // ── Compute the material cost difference ──
    $materialDiff = $customCost - $standardCost;

    // ── Get the markup percent (default 40 if null) ──
    $markupPercent = (float) ($product->customization_markup_percent ?? 40.0);

    // ── Compute the surcharge ──
    // Only when the custom build uses MORE material than the standard
    $rawSurcharge = 0.0;

    if ($materialDiff > 0) {
        $rawSurcharge = $materialDiff * (1 + ($markupPercent / 100));
    }

    // ── Floor at 0 ──
    $surcharge = max(0.0, $rawSurcharge);

    // ── Cap at base price × multiplier ──
    $basePrice    = (float) $product->price;
    $maxSurcharge = $basePrice * $this->maxSurchargeMultiplier;
    $capped       = false;

    if ($basePrice > 0 && $surcharge > $maxSurcharge) {
        $surcharge = $maxSurcharge;
        $capped    = true;
    }

    // ── Per-unit surcharge multiplied by quantity ──
    $totalSurcharge = $surcharge * $quantity;

    Log::info('[CUSTOMIZATION PRICING] Computed', [
        'product_id'      => $product->id,
        'standard_cost'   => $standardCost,
        'custom_cost'     => $customCost,
        'material_diff'   => $materialDiff,
        'markup_percent'  => $markupPercent,
        'surcharge_unit'  => $surcharge,
        'quantity'        => $quantity,
        'total_surcharge' => $totalSurcharge,
        'capped'          => $capped,
    ]);

    return [
        'applied'                 => $totalSurcharge > 0,
        'reason'                  => $capped ? 'capped' : 'ok',
        'base_price'              => round($basePrice, 2),
        'surcharge_per_unit'      => round($surcharge, 2),
        'quantity'                => $quantity,
        'surcharge'               => round($totalSurcharge, 2),
        'total'                   => round($basePrice * $quantity + $totalSurcharge, 2),
        'markup_percent'          => $markupPercent,
        'material_cost_standard'  => round($standardCost, 2),
        'material_cost_custom'    => round($customCost, 2),
        'material_cost_diff'      => round($materialDiff, 2),
        'capped'                  => $capped,
        'standard_dimensions'     => [
            'length'    => (float) ($product->standard_length    ?? 0),
            'width'     => (float) ($product->standard_width     ?? 0),
            'height'    => (float) ($product->standard_height    ?? 0),
            'thickness' => (float) ($product->standard_thickness ?? 0),
            'diameter'  => (float) ($product->standard_diameter  ?? 0),
            'depth'     => (float) ($product->standard_depth     ?? 0),
        ],
        'breakdown'               => $breakdown,
    ];
}

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    /**
     * Return a zero-surcharge result with a reason for logging/UI.
     */
    protected function emptyResult(string $reason): array
    {
        return [
            'applied'                => false,
            'reason'                 => $reason,
            'base_price'             => 0.0,
            'surcharge_per_unit'     => 0.0,
            'quantity'               => 0,
            'surcharge'              => 0.0,
            'total'                  => 0.0,
            'markup_percent'         => 0.0,
            'material_cost_standard' => 0.0,
            'material_cost_custom'   => 0.0,
            'material_cost_diff'     => 0.0,
            'capped'                 => false,
            'standard_dimensions'    => [],
            'breakdown'              => [],
        ];
    }

    /**
     * Build a `[part_id => dimensions]` array using the product's standard size.
     */
 protected function buildStandardPartsData(Product $product): array
{
    $standard = [];

    foreach ($product->parts as $part) {
        $standard[$part->id] = [
            'length'    => (float) ($product->standard_length    ?? 0),
            'width'     => (float) ($product->standard_width     ?? 0),
            'height'    => (float) ($product->standard_height    ?? 0),
            'thickness' => (float) ($product->standard_thickness ?? 1.0),
            'diameter'  => (float) ($product->standard_diameter  ?? 0),
            'depth'     => (float) ($product->standard_depth     ?? 0),
        ];
    }

    return $standard;
}

    /**
     * Normalize incoming customization_data to `[part_id => [length, width, height, thickness]]`.
     *
     * Handles both formats:
     *   A) ['parts' => [11 => [...], 12 => [...]]]
     *   B) [11 => [...], 12 => [...], 'finish_id' => 3]
     */
    protected function normalizePartsData(array $customizationData): array
    {
        $parts = [];

        // Case A — nested under 'parts'
        if (!empty($customizationData['parts']) && is_array($customizationData['parts'])) {
            foreach ($customizationData['parts'] as $partId => $dims) {
                if (is_array($dims)) {
                    $parts[$partId] = $this->normalizeDimensions($dims);
                }
            }
            return $parts;
        }

        // Case B — flat with numeric keys
        foreach ($customizationData as $key => $value) {
            if (is_numeric($key) && is_array($value)) {
                $parts[$key] = $this->normalizeDimensions($value);
            }
        }

        return $parts;
    }

    /**
     * Lowercase dimension keys and cast to float.
     */
   protected function normalizeDimensions(array $dims): array
{
    $normalized = [
        'length'    => 0.0,
        'width'     => 0.0,
        'height'    => 0.0,
        'thickness' => 0.0,
        'diameter'  => 0.0,
        'depth'     => 0.0,
    ];

    foreach ($dims as $key => $value) {
        $lower = strtolower($key);
        if (array_key_exists($lower, $normalized)) {
            $normalized[$lower] = (float) $value;
        }
    }

    return $normalized;
}


}
