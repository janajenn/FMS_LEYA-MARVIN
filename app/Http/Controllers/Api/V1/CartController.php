<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use App\Services\CustomizationPricingService;
use App\Services\MaterialCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    protected CustomizationPricingService $pricingService;

    public function __construct()
    {
        $this->pricingService = new CustomizationPricingService(
            new MaterialCalculationService()
        );
    }

    // ── List ──────────────────────────────────────────────
    public function index(Request $request)
    {
        $items = Cart::with([
            'product.images',
            'product.parts'          => fn ($q) => $q->orderBy('sort_order'),
            'product.parts.designs'  => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'product.finishMaterial',
            'variant.images',
        ])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data'       => $items->map(fn ($item) => $this->transform($item)),
            'cart_count' => (int) $items->sum('quantity'),
        ]);
    }

    // ── Single item (used by the edit screen) ────────────
    public function show(Request $request, Cart $cart)
    {
        $this->authorizeCart($request, $cart);

        $cart->load([
            'product.images',
            'product.parts'         => fn ($q) => $q->orderBy('sort_order'),
            'product.parts.designs' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'product.finishMaterial',
            'variant.images',
        ]);

        return response()->json(['data' => $this->transform($cart)]);
    }

    // ── Add ───────────────────────────────────────────────
    public function add(Request $request)
    {
        $validated = $request->validate([
            'product_id'    => 'required|exists:products,id',
            'quantity'      => 'required|integer|min:1',
            'variant_id'    => 'nullable|exists:product_variants,id',
            'customization' => 'nullable|array',
        ]);

        $userId = $request->user()->id;
        $product = Product::with(['parts.designs', 'finishMaterial'])->findOrFail($validated['product_id']);

        $customization = !empty($validated['customization'])
            ? $validated['customization']
            : null;

        // ⚠️ Compute pricing (surcharge + breakdown) — critical for finish / design / dimension fees
        $pricing = $this->computePricing(
            $product,
            $customization ?? [],
            $validated['quantity']
        );

        $existing = Cart::where('user_id', $userId)
            ->where('product_id', $validated['product_id'])
            ->where('variant_id', $validated['variant_id'] ?? null)
            ->where(function ($q) use ($customization) {
                if ($customization === null) {
                    $q->whereNull('customization_data');
                } else {
                    $q->where('customization_data', json_encode($customization));
                }
            })
            ->first();

        if ($existing) {
            $existing->quantity += $validated['quantity'];

            // Recompute for the new total quantity
            $repricing = $this->computePricing(
                $product,
                $customization ?? [],
                $existing->quantity
            );
            $existing->customization_surcharge = $repricing['surcharge'];
            $existing->customization_breakdown = $repricing['breakdown'];
            $existing->save();
        } else {
            Cart::create([
                'user_id'                 => $userId,
                'product_id'              => $validated['product_id'],
                'variant_id'              => $validated['variant_id'] ?? null,
                'quantity'                => $validated['quantity'],
                'customization_data'      => $customization,
                'customization_surcharge' => $pricing['surcharge'],
                'customization_breakdown' => $pricing['breakdown'],
            ]);
        }

        $count = (int) Cart::where('user_id', $userId)->sum('quantity');

        return response()->json([
            'message'    => 'Added to cart.',
            'cart_count' => $count,
        ]);
    }

    // ── Update quantity only ──────────────────────────────
    public function update(Request $request)
    {
        $validated = $request->validate([
            'cart_id'  => 'required|exists:carts,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $item = Cart::with('product.parts.designs')
            ->where('id', $validated['cart_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $item->quantity = $validated['quantity'];

        if ($item->product && $item->product->is_customizable && !empty($item->customization_data)) {
            $pricing = $this->computePricing(
                $item->product,
                $item->customization_data,
                $validated['quantity']
            );
            $item->customization_surcharge = $pricing['surcharge'];
            $item->customization_breakdown = $pricing['breakdown'];
        }

        $item->save();

        $count = (int) Cart::where('user_id', $request->user()->id)->sum('quantity');

        return response()->json([
            'message'    => 'Quantity updated.',
            'cart_count' => $count,
        ]);
    }

    // ── Update customization (used by Edit) ──────────────
    public function updateCustomization(Request $request, Cart $cart)
    {
        $this->authorizeCart($request, $cart);

        $validated = $request->validate([
            'quantity'      => 'required|integer|min:1',
            'variant_id'    => 'required|exists:product_variants,id',
            'customization' => 'nullable|array',
        ]);

        $product = $cart->product()->with(['parts.designs', 'finishMaterial'])->first();
        if (!$product) {
            return response()->json(['message' => 'Product no longer available.'], 422);
        }

        $customization = $validated['customization'] ?? [];
        $pricing = $this->computePricing($product, $customization, $validated['quantity']);

        $cart->update([
            'quantity'                => $validated['quantity'],
            'variant_id'              => $validated['variant_id'],
            'customization_data'      => $customization,
            'customization_surcharge' => $pricing['surcharge'],
            'customization_breakdown' => $pricing['breakdown'],
        ]);

        $count = (int) Cart::where('user_id', $request->user()->id)->sum('quantity');

        return response()->json([
            'message'    => 'Cart item updated.',
            'cart_count' => $count,
        ]);
    }

    // ── Remove ────────────────────────────────────────────
    public function remove(Request $request)
    {
        $validated = $request->validate([
            'cart_id' => 'required|exists:carts,id',
        ]);

        Cart::where('id', $validated['cart_id'])
            ->where('user_id', $request->user()->id)
            ->delete();

        $count = (int) Cart::where('user_id', $request->user()->id)->sum('quantity');

        return response()->json([
            'message'    => 'Removed from cart.',
            'cart_count' => $count,
        ]);
    }

    // ─────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────

    private function authorizeCart(Request $request, Cart $cart): void
    {
        abort_unless((int) $cart->user_id === (int) $request->user()->id, 403);
    }

    /**
     * Mirrors Customer\CartController::computePricing().
     * Duplicated here because that method is private.
     */
   private function computePricing(Product $product, array $customization, int $quantity): array
{
    if (!$product->is_customizable) {
        return ['surcharge' => 0.0, 'breakdown' => null];
    }

    $partsData = !empty($customization['parts'])
        ? $customization['parts']
        : $customization;

    $product->loadMissing(['parts.designs', 'materials']);

    try {
        // ── 1. Material-based dimension surcharge (legacy calc) ──
        $result = $this->pricingService->calculateSurcharge($product, $partsData, $quantity);
        $materialBasedSurcharge = (float) ($result['surcharge'] ?? 0);

        // ── 2. Per-inch dimension surcharge (mirrors web Shop/Show.jsx) ──
        $perInchSurcharge = 0;
        if (is_array($partsData)) {
            foreach ($partsData as $partId => $partData) {
                $part = $product->parts->firstWhere('id', $partId);
                if (!$part || !$part->is_customizable) continue;

                $fields     = is_array($part->dimension_fields)  ? $part->dimension_fields  : [];
                $pricingMap = is_array($part->dimension_pricing) ? $part->dimension_pricing : [];

                foreach ($fields as $field) {
                    $std  = (float) ($part->{"standard_{$field}"} ?? 0);
                    $cur  = (float) ($partData[$field]           ?? $std);
                    $rate = (float) ($pricingMap[$field]         ?? 0);

                    if ($cur > $std && $rate > 0) {
                        $perInchSurcharge += ($cur - $std) * $rate;
                    }
                }
            }
        }

        // ── 3. Take the larger so we never undercharge ──
        $dimensionSurcharge = max($materialBasedSurcharge, $perInchSurcharge);

        // ── 4. Finish surcharge ──
        $finishOption    = $customization['finish_option'] ?? 'ordinary';
        $finishSurcharge = 0;
        if ($finishOption === 'standard') {
            $finishSurcharge = (float) ($product->standard_finish_surcharge ?? 0);
        }

        // ── 5. Design + design labor ──
        $designSurcharge      = 0;
        $designLaborSurcharge = 0;

        if (is_array($partsData)) {
            foreach ($partsData as $partId => $data) {
                if (empty($data['design_id'])) continue;

                $part = $product->parts->firstWhere('id', $partId);
                if (!$part) continue;

                $design = $part->designs->firstWhere('id', $data['design_id']);
                if (!$design || $design->is_default) continue;

                $designSurcharge      += (float) $design->additional_cost;
                $designLaborSurcharge += (float) ($design->additional_labor_cost ?? 0);
            }
        }

        $totalSurcharge = $dimensionSurcharge
            + $finishSurcharge
            + $designSurcharge
            + $designLaborSurcharge;

        return [
            'surcharge' => $totalSurcharge,
            'breakdown' => [
                'rows'                    => $result['breakdown'] ?? [],
                'standard_dimensions'     => $result['standard_dimensions'] ?? null,
                'markup_percent'          => $result['markup_percent'] ?? 0,
                'material_cost_standard'  => $result['material_cost_standard'] ?? 0,
                'material_cost_custom'    => $result['material_cost_custom'] ?? 0,
                'material_cost_diff'      => $result['material_cost_diff'] ?? 0,

                // ← these four are what the mobile breakdown reads
                'dimension_surcharge'     => $dimensionSurcharge,
                'finish_surcharge'        => $finishSurcharge,
                'design_surcharge'        => $designSurcharge,
                'design_labor_surcharge'  => $designLaborSurcharge,
            ],
        ];
    } catch (\Exception $e) {
        Log::error('[API CART PRICING] Failed', [
            'product_id' => $product->id,
            'error'      => $e->getMessage(),
        ]);
        return ['surcharge' => 0.0, 'breakdown' => null];
    }
}

       private function transform(Cart $item): array
{
    $basePrice = (float) ($item->variant?->price ?? $item->product?->price ?? 0);
    $laborCost = (float) ($item->product?->labor_cost ?? 0);

    // ── Detect a stale / legacy breakdown and refresh it ──
    $rawBreakdown = $item->customization_breakdown;
    $isStale =
        $item->product !== null
        && $item->product->is_customizable
        && !empty($item->customization_data)
        && (
            !is_array($rawBreakdown)
            || !array_key_exists('design_surcharge', $rawBreakdown)
            || !array_key_exists('design_labor_surcharge', $rawBreakdown)   // NEW
            || !array_key_exists('dimension_surcharge', $rawBreakdown)      // NEW
            || !array_key_exists('finish_surcharge', $rawBreakdown)
            || !array_key_exists('rows', $rawBreakdown)
        );

    if ($isStale) {
        try {
            $fresh = $this->computePricing(
                $item->product,
                $item->customization_data ?? [],
                (int) $item->quantity
            );
            $item->customization_surcharge = $fresh['surcharge'];
            $item->customization_breakdown = $fresh['breakdown'];
            $rawBreakdown = $fresh['breakdown'];
        } catch (\Throwable $e) {
            Log::warning('[API CART] stale-breakdown recompute failed', [
                'cart_id'    => $item->id,
                'product_id' => $item->product_id,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    $surcharge = (float) ($item->customization_surcharge ?? 0);
    $lineTotal = ($basePrice + $laborCost) * $item->quantity + $surcharge;

    $customizationData = $item->customization_data ?? [];
    $finishOption      = $customizationData['finish_option'] ?? 'ordinary';
    $finishMaterial    = $item->product?->finishMaterial?->name;

    $finishName = $finishOption === 'standard'
        ? ('Standard' . ($finishMaterial ? " ({$finishMaterial})" : ''))
        : 'Ordinary (No varnish)';

    // ── Read breakdown components ──
    $rows                 = null;
    $markupPercent        = 0;
    $materialCostStandard = 0;
    $materialCostCustom   = 0;
    $materialCostDiff     = 0;
    $dimensionSurcharge   = 0;   // NEW
    $finishSurcharge      = 0;
    $designSurcharge      = 0;
    $designLaborSurcharge = 0;   // NEW

    if (is_array($rawBreakdown)) {
        if (array_key_exists('rows', $rawBreakdown)) {
            $rows                 = $rawBreakdown['rows'];
            $markupPercent        = (float) ($rawBreakdown['markup_percent'] ?? 0);
            $materialCostStandard = (float) ($rawBreakdown['material_cost_standard'] ?? 0);
            $materialCostCustom   = (float) ($rawBreakdown['material_cost_custom'] ?? 0);
            $materialCostDiff     = (float) ($rawBreakdown['material_cost_diff'] ?? 0);
            $dimensionSurcharge   = (float) ($rawBreakdown['dimension_surcharge'] ?? 0);
            $finishSurcharge      = (float) ($rawBreakdown['finish_surcharge'] ?? 0);
            $designSurcharge      = (float) ($rawBreakdown['design_surcharge'] ?? 0);
            $designLaborSurcharge = (float) ($rawBreakdown['design_labor_surcharge'] ?? 0);
        } else {
            $rows = $rawBreakdown;
        }
    }

    // ── Defensive recompute for legacy cart rows that pre-date these fields ──
    $recomputedDesign = 0;
    $recomputedLabor  = 0;
    $partsById        = ($item->product?->parts ?? collect())->keyBy('id');
    foreach ($customizationData as $partId => $partData) {
        if (!is_array($partData) || !isset($partData['design_id'])) continue;
        $part = $partsById->get((string) $partId) ?? $partsById->get((int) $partId);
        if (!$part) continue;
        $design = $part->designs->firstWhere('id', $partData['design_id']);
        if ($design && !$design->is_default) {
            $recomputedDesign += (float) $design->additional_cost;
            $recomputedLabor  += (float) ($design->additional_labor_cost ?? 0);
        }
    }
    if ($designSurcharge === 0 && $recomputedDesign > 0)      $designSurcharge      = $recomputedDesign;
    if ($designLaborSurcharge === 0 && $recomputedLabor > 0)  $designLaborSurcharge = $recomputedLabor;

    if ($finishSurcharge === 0 && $finishOption === 'standard' && $item->product) {
        $finishSurcharge = (float) ($item->product->standard_finish_surcharge ?? 0);
    }

    // Derive dimension surcharge for legacy rows so breakdown sums to total
    if ($dimensionSurcharge === 0 && $surcharge > 0) {
        $derived = $surcharge
            - $finishSurcharge
            - $designSurcharge
            - $designLaborSurcharge;
        $dimensionSurcharge = max(0, $derived);
    }

    return [
        'id'                      => $item->id,
        'quantity'                => (int) $item->quantity,
        'customization'           => $item->customization_data,
        'customization_surcharge' => $surcharge,
        'customization_breakdown' => $rows,
        'line_total'              => round($lineTotal, 2),

        'finish_option'           => $finishOption,
        'finish_name'             => $finishName,
        'finish_surcharge'        => $finishSurcharge,
        'design_surcharge'        => $designSurcharge,
        'design_labor_surcharge'  => $designLaborSurcharge,   // NEW
        'dimension_surcharge'     => $dimensionSurcharge,     // NEW
        'material_cost_standard'  => $materialCostStandard,
        'material_cost_custom'    => $materialCostCustom,
        'material_cost_diff'      => $materialCostDiff,
        'markup_percent'          => $markupPercent,

        'product' => $item->product ? [
            'id'                   => $item->product->id,
            'name'                 => $item->product->name,
            'slug'                 => $item->product->slug,
            'price'                => (float) $item->product->price,
            'labor_cost'           => $laborCost,
            'image_url'            => $item->product->images?->first()
                ? asset('storage/' . $item->product->images->first()->path)
                : null,
            'finish_material_name' => $finishMaterial,

            'parts' => $item->product->parts->map(fn ($p) => [
                'id'                 => $p->id,
                'name'               => $p->name,
                'reference_image'    => $p->reference_image
                    ? asset('storage/' . $p->reference_image)
                    : null,
                'dimension_fields'   => $p->dimension_fields ?? [],
                'dimension_pricing'  => $p->dimension_pricing ?? null,
                'standard_length'    => $p->standard_length    !== null ? (float) $p->standard_length    : null,
                'standard_width'     => $p->standard_width     !== null ? (float) $p->standard_width     : null,
                'standard_height'    => $p->standard_height    !== null ? (float) $p->standard_height    : null,
                'standard_thickness' => $p->standard_thickness !== null ? (float) $p->standard_thickness : null,
                'standard_diameter'  => $p->standard_diameter  !== null ? (float) $p->standard_diameter  : null,
                'standard_depth'     => $p->standard_depth     !== null ? (float) $p->standard_depth     : null,

                'designs' => $p->designs->map(fn ($d) => [
                    'id'                    => $d->id,
                    'name'                  => $d->name,
                    'image_url'             => $d->image_path
                        ? asset('storage/' . $d->image_path)
                        : null,
                    'additional_cost'       => (float) $d->additional_cost,
                    'additional_labor_cost' => (float) ($d->additional_labor_cost ?? 0),   // NEW
                    'is_default'            => (bool) $d->is_default,
                ]),
            ]),
        ] : null,

        'variant' => $item->variant ? [
            'id'        => $item->variant->id,
            'name'      => $item->variant->name,
            'slug'      => $item->variant->slug,
            'price'     => (float) $item->variant->price,
            'image_url' => $item->variant->images?->first()
                ? asset('storage/' . $item->variant->images->first()->path)
                : null,
        ] : null,
    ];
}
}
