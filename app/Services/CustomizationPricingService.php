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
     * Per-part standards take priority. If a part has its own standard_*
     * values, those are used as the baseline for that part. Otherwise we
     * fall back to the product-level standard dimensions (legacy behaviour).
     */
    public function calculateSurcharge(Product $product, array $partsData, int $quantity = 1): array
    {
        // ── Guard: non-customizable products never have a surcharge ──
        if (!$product->is_customizable) {
            return $this->emptyResult('product_not_customizable');
        }

        // ── Ensure relations are loaded (needed for the guard below) ──
        $product->loadMissing(['parts', 'materials']);

        // ── Guard: at least one standard (product OR part) must exist ──
        $hasProductStandards =
            $product->standard_length !== null ||
            $product->standard_width  !== null ||
            $product->standard_height !== null;

        $hasPartStandards = $product->parts->contains(function ($part) {
            return $part->standard_length    !== null
                || $part->standard_width     !== null
                || $part->standard_height    !== null
                || $part->standard_thickness !== null
                || $part->standard_diameter  !== null
                || $part->standard_depth     !== null;
        });

        if (!$hasProductStandards && !$hasPartStandards) {
            return $this->emptyResult('no_standard_dimensions');
        }

        // ── Normalize parts data ──
        $normalizedParts = $this->normalizePartsData($partsData);

        if (empty($normalizedParts)) {
            return $this->emptyResult('no_parts_data');
        }

        if ($product->materials->isEmpty()) {
            return $this->emptyResult('no_materials');
        }

        // ── Build per-part fallbacks ──
        // For each part, we look up its own standard_* values. If any are
        // null, we fall back to the product-level standards. Only if BOTH
        // are missing do we use a hardcoded default (1.0 for thickness, 0 otherwise).
        $fallbacksByPart = [];

        foreach ($product->parts as $part) {
            $fallbacksByPart[$part->id] = [
                'length'    => (float) ($part->standard_length    ?? $product->standard_length    ?? 0),
                'width'     => (float) ($part->standard_width     ?? $product->standard_width     ?? 0),
                'height'    => (float) ($part->standard_height    ?? $product->standard_height    ?? 0),
                'thickness' => (float) ($part->standard_thickness ?? $product->standard_thickness ?? 1.0),
                'diameter'  => (float) ($part->standard_diameter  ?? $product->standard_diameter  ?? 0),
                'depth'     => (float) ($part->standard_depth     ?? $product->standard_depth     ?? 0),
            ];
        }

        // Fallback used when the customer sent a part ID we don't recognise
        $defaultFallbacks = [
            'length'    => (float) ($product->standard_length    ?? 0),
            'width'     => (float) ($product->standard_width     ?? 0),
            'height'    => (float) ($product->standard_height    ?? 0),
            'thickness' => (float) ($product->standard_thickness ?? 1.0),
            'diameter'  => (float) ($product->standard_diameter  ?? 0),
            'depth'     => (float) ($product->standard_depth     ?? 0),
        ];

        // Fill missing/zero dimensions with the correct per-part fallback
        foreach ($normalizedParts as $partId => &$dims) {
            $partFallbacks = $fallbacksByPart[$partId] ?? $defaultFallbacks;

            foreach ($partFallbacks as $dim => $fallbackValue) {
                if (!isset($dims[$dim]) || $dims[$dim] === 0.0) {
                    $dims[$dim] = $fallbackValue;
                }
            }
        }
        unset($dims);

        // ── Build standard parts data (now uses per-part standards) ──
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

        // ── Compute the surcharge (only when custom build uses MORE material) ──
        $rawSurcharge = 0.0;

        if ($materialDiff > 0) {
            $rawSurcharge = $materialDiff * (1 + ($markupPercent / 100));
        }

        $surcharge = max(0.0, $rawSurcharge);

        // ── Cap at base price × multiplier ──
        $basePrice    = (float) $product->price;
        $maxSurcharge = $basePrice * $this->maxSurchargeMultiplier;
        $capped       = false;

        if ($basePrice > 0 && $surcharge > $maxSurcharge) {
            $surcharge = $maxSurcharge;
            $capped    = true;
        }

        // ── Per-unit surcharge × quantity ──
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
            'per_part_mode'   => $hasPartStandards,
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
     * Build a `[part_id => dimensions]` array using each part's OWN standard
     * dimensions. Falls back to the product-level standards if a part hasn't
     * defined its own.
     */
    protected function buildStandardPartsData(Product $product): array
    {
        $standard = [];

        foreach ($product->parts as $part) {
            $standard[$part->id] = [
                'length'    => (float) ($part->standard_length    ?? $product->standard_length    ?? 0),
                'width'     => (float) ($part->standard_width     ?? $product->standard_width     ?? 0),
                'height'    => (float) ($part->standard_height    ?? $product->standard_height    ?? 0),
                'thickness' => (float) ($part->standard_thickness ?? $product->standard_thickness ?? 1.0),
                'diameter'  => (float) ($part->standard_diameter  ?? $product->standard_diameter  ?? 0),
                'depth'     => (float) ($part->standard_depth     ?? $product->standard_depth     ?? 0),
            ];
        }

        return $standard;
    }

    /**
     * Normalize incoming customization_data to `[part_id => [length, width, ...]]`.
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
