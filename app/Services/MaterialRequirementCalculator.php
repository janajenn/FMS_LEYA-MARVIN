<?php

namespace App\Services;

use App\Models\Material;
use App\Models\Product;
use Illuminate\Support\Facades\Log;

/**
 * MaterialRequirementCalculator — computes per-material quantities needed
 * to build ONE unit of a product.
 *
 * Model B (variant-driven):
 *   ── WOOD    : variant.material, sized by board-feet (formula ii)
 *   ── FINISH  : product.finish_material_id, 1 unit, only if Standard
 *   ── EXTRAS  : any additional product_materials pivot rows (legacy
 *               products only — new products have an empty pivot)
 *
 * Returns: [material_id => quantity_per_unit_of_product]
 */
class MaterialRequirementCalculator
{
    /** How many units of finish material are consumed per finished product. */
    public const DEFAULT_FINISH_QUANTITY = 1.0;

    public function calculateForUnit(
        Product $product,
        array $partsData,
        ?int $variantMaterialId = null,
        string $finishOption = 'ordinary'
    ): array {
        $requirements = [];

        // ── 1. WOOD — from the variant ──
        if ($variantMaterialId) {
            $woodMaterial = Material::find($variantMaterialId);
            if ($woodMaterial) {
                $bf = $this->calculateBoardFeet($product, $partsData, $woodMaterial);
                if ($bf > 0) {
                    $requirements[$woodMaterial->id] = round($bf, 4);
                }
            } else {
                Log::warning('[MAT CALC] Variant material not found', [
                    'variant_material_id' => $variantMaterialId,
                    'product_id'          => $product->id,
                ]);
            }
        } else {
            Log::info('[MAT CALC] No variant material selected — no wood deduction', [
                'product_id' => $product->id,
            ]);
        }

        // ── 2. FINISH — only when Standard is chosen ──
        if ($finishOption === 'standard' && $product->finish_material_id) {
            $existing = $requirements[$product->finish_material_id] ?? 0.0;
            $requirements[$product->finish_material_id] = $existing + self::DEFAULT_FINISH_QUANTITY;
        }

        // ── 3. EXTRAS — legacy BOM rows (skip wood & finish already handled) ──
        $product->loadMissing('materials');
        foreach ($product->materials as $bomMaterial) {
            if (isset($requirements[$bomMaterial->id])) continue;
            if ($variantMaterialId && (int) $bomMaterial->id === (int) $variantMaterialId) continue;
            if ($product->finish_material_id && (int) $bomMaterial->id === (int) $product->finish_material_id) continue;

            $pivot = $bomMaterial->pivot;
            $rule  = $pivot->calculation_rule ?? 'fixed';

            switch ($rule) {
                case 'fixed':
                    $qty = (float) ($pivot->quantity ?? 0);
                    if ($qty > 0) $requirements[$bomMaterial->id] = $qty;
                    break;

                case 'board_feet':
                    $bf = $this->calculateBoardFeet($product, $partsData, $bomMaterial);
                    if ($bf > 0) $requirements[$bomMaterial->id] = round($bf, 4);
                    break;

                case 'linear_feet':
                    $total = 0.0;
                    foreach ($partsData as $dims) {
                        $total += (float) ($dims['length'] ?? $dims['height'] ?? 0);
                    }
                    if ($total > 0) $requirements[$bomMaterial->id] = round($total / 12, 4);
                    break;
            }
        }

        return $requirements;
    }

    /**
     * Board-feet using formula (ii): board-count × board-volume.
     * Falls back to (i) finished-volume when material has no thickness/width.
     *
     * Formula (ii):
     *   boards_across_thickness = ceil(part_thickness / material_thickness)
     *   boards_across_width     = ceil(part_width     / material_width)
     *   board_feet_per_board    = (part_length × material_width × material_thickness) / 144
     *   total += boards_across_thickness × boards_across_width × board_feet_per_board
     *
     * Formula (i) fallback:
     *   total += (part_length × part_width × part_thickness) / 144
     */
    protected function calculateBoardFeet(Product $product, array $partsData, Material $material): float
    {
        $materialT = (float) ($material->attributes['thickness'] ?? 0);
        $materialW = (float) ($material->attributes['width']     ?? 0);

        $partMap = $product->parts->keyBy('id');
        $total   = 0.0;

        foreach ($partsData as $partId => $dims) {
            $part = $partMap[$partId] ?? null;
            if (!$part) continue;
            if (!is_array($dims)) continue;

            // Resolve part dimensions with sensible fallbacks
            $partL = (float) ($dims['length']    ?? $dims['height']    ?? $part->standard_length    ?? $part->standard_height ?? 0);
            $partW = (float) ($dims['width']     ?? $dims['diameter']  ?? $part->standard_width     ?? $part->standard_diameter ?? 0);
            $partT = (float) ($dims['thickness'] ?? $part->standard_thickness ?? 0);

            if ($partW <= 0 && isset($dims['diameter'])) $partW = (float) $dims['diameter'];
            if ($partT <= 0) $partT = 1.0;
            if ($partL <= 0 || $partW <= 0) continue;

            if ($materialT > 0 && $materialW > 0) {
                // Formula (ii)
                $boardsT    = (int) ceil($partT / $materialT);
                $boardsW    = (int) ceil($partW / $materialW);
                $boardVol   = ($partL * $materialW * $materialT) / 144;
                $total     += $boardsT * $boardsW * $boardVol;
            } else {
                // Formula (i) fallback
                $total += ($partL * $partW * $partT) / 144;
            }
        }

        return $total;
    }
}
