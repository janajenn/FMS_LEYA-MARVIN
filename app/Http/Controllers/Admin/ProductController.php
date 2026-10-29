<?php

namespace App\Http\Controllers\Admin;
use App\Models\ProductPartDesign;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Material;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use App\Models\ProductPart;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\ProductSizeTemplate;
use App\Services\MaterialCalculationService;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;

class ProductController extends Controller
{
    private function unitProps(): array
    {
        return [
            'dimension'      => config('units.dimension'),
            'dimensionShort' => config('units.dimension_short'),
            'dimensionLabel' => config('units.dimension_label'),
        ];
    }

    public function index()
    {
        $products = Product::with(['category', 'images'])->get();
        return Inertia::render('Admin/Products/Index', ['products' => $products]);
    }

    /* ═══════════════════════════════════════════════════════════════
     *  CREATE — passes only the categories the simplified form needs.
     *  The old props (materials, finishMaterials, sizeTemplates, units)
     *  are no longer sent because the form doesn't use them.
     * ═══════════════════════════════════════════════════════════════ */


public function create()
{
    return Inertia::render('Admin/Products/Create', [
        'categories'      => ProductCategory::all(),
        'woodMaterials'   => $this->woodMaterialsForPicker(),
        'finishMaterials' => $this->finishMaterialsForPicker(),
    ]);
}

public function edit(Product $product)
{
    $product->load([
        'images',
        'variants.material',
        'variants.images',
        'parts.designs',
    ]);

    return Inertia::render('Admin/Products/Edit', [
        'product'         => $product,
        'categories'      => ProductCategory::all(),
        'woodMaterials'   => $this->woodMaterialsForPicker(),
        'finishMaterials' => $this->finishMaterialsForPicker(),
    ]);
}

    /* ═══════════════════════════════════════════════════════════════
     *  STORE — simplified. Only the 6 basic fields are validated.
     *  No material/part/variant sync happens here.
     *
     *  When customization is redesigned, we'll add the extra
     *  validation + sync calls back into this method.
     * ═══════════════════════════════════════════════════════════════ */
public function store(Request $request)
{
    $logContext = [
        'controller' => __CLASS__,
        'method'     => __METHOD__,
        'user_id'    => auth()->id(),
    ];

    try {
        $validated = $request->validate([
            // ─── Product core ───
            'category_id'    => 'required|exists:product_categories,id',
            'name'           => 'required|string|max:255|unique:products',
            'description'    => 'nullable|string',
            'stock_quantity' => 'required|integer|min:0',
            'status'         => 'required|in:active,inactive',

            // ─── Ordinary / Standard option ───
            'standard_finish_surcharge' => 'required|numeric|min:0',
            'finish_material_id'        => 'nullable|exists:materials,id',

            // ─── Wood Types (variants) ───
            'variants'               => 'required|array|min:1',
            'variants.*.material_id' => 'required|exists:materials,id',
            'variants.*.price'       => 'required|numeric|min:0',
            'variants.*.description' => 'nullable|string',
            'variants.*.is_active'   => 'sometimes|boolean',
            'variants.*.sort_order'  => 'nullable|integer',
            'variants.*.images'      => 'nullable|array',
            'variants.*.images.*'    => 'image|max:10240',

            // ─── Furniture Parts ───
            'parts'          => 'required|array|min:1',
            'parts.*.name'   => 'required|string|max:255',
            'parts.*.sort_order' => 'nullable|integer',

            'parts.*.standard_length'    => 'nullable|numeric|min:0',
            'parts.*.standard_width'     => 'nullable|numeric|min:0',
            'parts.*.standard_height'    => 'nullable|numeric|min:0',
            'parts.*.standard_thickness' => 'nullable|numeric|min:0',
            'parts.*.standard_diameter'  => 'nullable|numeric|min:0',
            'parts.*.standard_depth'     => 'nullable|numeric|min:0',

            'parts.*.dimension_fields'           => 'nullable|array',
            'parts.*.dimension_fields.*'         => 'string|in:length,width,height,thickness,diameter,depth',

            'parts.*.is_customizable'            => 'sometimes|boolean',
            'parts.*.dimension_bounds'           => 'nullable|array',
            'parts.*.dimension_bounds.*'         => 'array',
            'parts.*.dimension_bounds.*.min'     => 'nullable|numeric|min:0',
            'parts.*.dimension_bounds.*.max'     => 'nullable|numeric|min:0',
            'parts.*.dimension_pricing'          => 'nullable|array',
            'parts.*.dimension_pricing.*'        => 'nullable|numeric|min:0',

            'parts.*.allow_design_selection'     => 'sometimes|boolean',

            'parts.*.designs'                       => 'nullable|array',
            'parts.*.designs.*.id'                  => 'nullable|integer|exists:product_part_designs,id',
            'parts.*.designs.*.name'                => 'nullable|string|max:255',
            'parts.*.designs.*.is_default'          => 'sometimes|boolean',
            'parts.*.designs.*.is_active'           => 'sometimes|boolean',
            'parts.*.designs.*.sort_order'          => 'nullable|integer',
            'parts.*.designs.*.image'               => 'nullable|image|max:10240',
            'parts.*.designs.*.existing_image_path' => 'nullable|string',
            'parts.*.designs.*.additional_cost'     => 'nullable|numeric|min:0',
        ]);

        // ── Sanitize empty-string IDs → null (MySQL BIGINT columns reject '') ──
        $validated['finish_material_id'] = $validated['finish_material_id'] ?: null;

        // ── Sanitize empty-string numeric fields → null ──
        foreach ($validated['parts'] ?? [] as $i => $part) {
            foreach (['standard_length','standard_width','standard_height','standard_thickness','standard_diameter','standard_depth'] as $f) {
                if (isset($validated['parts'][$i][$f]) && $validated['parts'][$i][$f] === '') {
                    $validated['parts'][$i][$f] = null;
                }
            }
        }

        // ⚠️ All products are customizable now
        $validated['is_customizable'] = true;

        // ── Derive display price BEFORE inserting (products.price is NOT NULL) ──
        $validated['price'] = collect($validated['variants'])
            ->min(fn ($v) => (float) ($v['price'] ?? 0)) ?? 0;

        DB::beginTransaction();

        // ─── Create the product row (price is now set) ───
        $product = Product::create($validated);

        // ─── Wood types ───
        $this->syncVariants($product, $validated['variants'], $request);

        // ─── Parts + designs ───
        $this->syncParts($product, $validated['parts']);

        // No follow-up save needed — price was set at creation time.

        DB::commit();

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product created successfully.');

    } catch (ValidationException $e) {
        DB::rollBack();
        return back()->withInput()->withErrors($e->errors());

    } catch (QueryException $e) {
        DB::rollBack();
        Log::error('Product creation database error', array_merge($logContext, [
            'message'  => $e->getMessage(),
            'sql'      => $e->getSql(),
            'bindings' => $e->getBindings(),
        ]));
        return back()->withInput()
            ->withErrors(['error' => 'A database error occurred. Please try again.']);

    } catch (\Throwable $e) {
        DB::rollBack();
        Log::error('Product creation failed', array_merge($logContext, [
            'message' => $e->getMessage(),
            'file'    => $e->getFile(),
            'line'    => $e->getLine(),
            'trace'   => $e->getTraceAsString(),
        ]));
        return back()->withInput()->withErrors(['error' => $e->getMessage()]);
    }
}
    /* ═══════════════════════════════════════════════════════════════
     *  EDIT — passes only the product + categories.


    /* ═══════════════════════════════════════════════════════════════
     *  UPDATE — simplified.
     *
     *  ⚠️ IMPORTANT: we do NOT call syncMaterials(), syncParts(), or
     *  syncVariants() here. Existing products that already have a BOM,
     *  parts, or variants keep them untouched.
     *
     *  This is the safe path: when the admin saves the simplified form,
     *  only the 6 basic fields change. Nothing else is destroyed.
     * ═══════════════════════════════════════════════════════════════ */
  public function update(Request $request, Product $product)
{
    $logContext = [
        'controller'  => __CLASS__,
        'method'      => __METHOD__,
        'user_id'     => auth()->id(),
        'user_role'   => auth()->user()?->role?->slug,
        'product_id'  => $product->id,
        'timestamp'   => now()->toDateTimeString(),
        'request_data'=> $this->sanitizeRequestData($request->all()),
    ];

    try {
        $validated = $request->validate([
            // ─── Product core ───
            'category_id'    => 'sometimes|required|exists:product_categories,id',
            'name'           => 'sometimes|required|string|max:255|unique:products,name,' . $product->id,
            'description'    => 'nullable|string',
            'stock_quantity' => 'nullable|integer|min:0',
            'status'         => 'nullable|in:active,inactive',

            // ─── Ordinary / Standard option ───
            'standard_finish_surcharge' => 'nullable|numeric|min:0',
            'finish_material_id'        => 'nullable|exists:materials,id',

            // ─── Wood Types (variants) ───
            'variants'                    => 'nullable|array',
            'variants.*.id'               => 'nullable|integer|exists:product_variants,id',
            'variants.*.material_id'      => 'required_with:variants|exists:materials,id',
            'variants.*.price'            => 'required_with:variants|numeric|min:0',
            'variants.*.description'      => 'nullable|string',
            'variants.*.is_active'        => 'sometimes|boolean',
            'variants.*.sort_order'       => 'nullable|integer',
            'variants.*.images'           => 'nullable|array',
           'variants.*.images.*'     => 'image|max:10240',
            'variants.*.delete_images'    => 'nullable|array',
            'variants.*.delete_images.*'  => 'integer|exists:product_images,id',

            // ─── Furniture Parts ───
            'parts'          => 'nullable|array',
            'parts.*.id'     => 'nullable|integer|exists:product_parts,id',
            'parts.*.name'   => 'required_with:parts|string|max:255',
            'parts.*.sort_order' => 'nullable|integer',

            // Part standard dimensions
            'parts.*.standard_length'    => 'nullable|numeric|min:0',
            'parts.*.standard_width'     => 'nullable|numeric|min:0',
            'parts.*.standard_height'    => 'nullable|numeric|min:0',
            'parts.*.standard_thickness' => 'nullable|numeric|min:0',
            'parts.*.standard_diameter'  => 'nullable|numeric|min:0',
            'parts.*.standard_depth'     => 'nullable|numeric|min:0',

            // Part dimension fields toggles
            'parts.*.dimension_fields'           => 'nullable|array',
            'parts.*.dimension_fields.*'         => 'string|in:length,width,height,thickness,diameter,depth',

            // Part customization toggle + bounds
            'parts.*.is_customizable'            => 'sometimes|boolean',
            'parts.*.dimension_bounds'           => 'nullable|array',
            'parts.*.dimension_bounds.*'         => 'array',
            'parts.*.dimension_bounds.*.min'     => 'nullable|numeric|min:0',
            'parts.*.dimension_bounds.*.max'     => 'nullable|numeric|min:0',
            'parts.*.dimension_pricing' => 'nullable|array',
            'parts.*.dimension_pricing.*' => 'nullable|numeric|min:0',

            // Part design selection toggle
            'parts.*.allow_design_selection'     => 'sometimes|boolean',

            // Part designs
            'parts.*.designs'                       => 'nullable|array',
            'parts.*.designs.*.id'                  => 'nullable|integer|exists:product_part_designs,id',
            'parts.*.designs.*.name'                => 'nullable|string|max:255',
            'parts.*.designs.*.is_default'          => 'sometimes|boolean',
            'parts.*.designs.*.is_active'           => 'sometimes|boolean',
            'parts.*.designs.*.sort_order'          => 'nullable|integer',
            'parts.*.designs.*.image' => 'nullable|image|max:10240',   // was 2048
            'parts.*.designs.*.existing_image_path' => 'nullable|string',
            'parts.*.designs.*.additional_cost' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();

        // ─── Update the product row ───
        $product->update($validated);

        // ─── Sync wood types ───
        if ($request->has('variants')) {
            $this->syncVariants($product, $validated['variants'], $request);
        }

        // ─── Sync parts + designs ───
        if ($request->has('parts')) {
            $this->syncParts($product, $validated['parts']);
        }

        // ─── Refresh the display price ───
        $product->price = $product->variants()->min('price') ?? $product->price;
        $product->save();

        DB::commit();

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product updated successfully.');

    } catch (ValidationException $e) {
        DB::rollBack();
        Log::warning('Product update validation failed', array_merge($logContext, [
            'errors' => $e->errors(),
        ]));
        return back()->withInput()->withErrors($e->errors());

    } catch (QueryException $e) {
        DB::rollBack();
        Log::error('Product update database error', array_merge($logContext, [
            'message'  => $e->getMessage(),
            'sql'      => $e->getSql(),
            'bindings' => $e->getBindings(),
            'code'     => $e->getCode(),
            'file'     => $e->getFile(),
            'line'     => $e->getLine(),
        ]));
        return back()->withInput()
            ->withErrors(['error' => 'A database error occurred. Please try again.']);

    } catch (\Throwable $e) {
        DB::rollBack();
        Log::error('Product update failed', array_merge($logContext, [
            'message' => $e->getMessage(),
            'code'    => $e->getCode(),
            'file'    => $e->getFile(),
            'line'    => $e->getLine(),
            'trace'   => $e->getTraceAsString(),
        ]));
        return back()->withInput()
            ->withErrors(['error' => $e->getMessage()]);
    }
}



    /* ═══════════════════════════════════════════════════════════════
     *  DESTROY — unchanged. Cleanly removes relations on delete.
     * ═══════════════════════════════════════════════════════════════ */
    public function destroy(Product $product)
    {
        $productName = $product->name;
        $productId   = $product->id;

        DB::beginTransaction();
        try {
            $product->delete();

            DB::commit();

            Log::info('Product soft-deleted', [
                'product_id'   => $productId,
                'product_name' => $productName,
                'deleted_by'   => auth()->id(),
            ]);

            return redirect()
                ->route('admin.products.index')
                ->with('success', "Product \"{$productName}\" deleted. Existing orders are preserved.");

        } catch (\Throwable $e) {
            DB::rollBack();

            Log::error('Product deletion failed', [
                'product_id' => $productId,
                'error'      => $e->getMessage(),
                'trace'      => $e->getTraceAsString(),
            ]);

            return redirect()
                ->route('admin.products.index')
                ->with('error', 'Failed to delete product: ' . $e->getMessage());
        }
    }

    /* ═══════════════════════════════════════════════════════════════
     *  The methods below are UNUSED by the simplified flow but KEPT
     *  for the upcoming customization redesign. Do not delete them.
     * ═══════════════════════════════════════════════════════════════ */

    private function unitPropsUnused()
    {
        return $this->unitProps(); // keep the helper referenced
    }


    /**
 * Materials belonging to the Wood category, shaped for the picker modal.
 */
/**
 * Materials under the Wood category, shaped for the wood-type picker.
 * The material image is optional — the picker shows a placeholder
 * when it's missing.
 */
private function woodMaterialsForPicker()
{
    return Material::query()
        ->whereHas('category', fn ($q) => $q->where('slug', 'wood'))
        ->orderBy('name')
        ->get()
        ->map(fn ($m) => [
            'id'             => $m->id,
            'name'           => $m->name,
            'unit'           => $m->unit,
            'cost'           => (float) $m->cost,
            'stock_quantity' => (float) $m->stock_quantity,
            'image_url'      => $m->image_url,   // may be null
            'thickness'      => $m->attributes['thickness'] ?? null,
            'width'          => $m->attributes['width']     ?? null,
            'length'         => $m->attributes['length']    ?? null,
        ])
        ->values();
}


private function finishMaterialsForPicker()
{
    return Material::where('is_finish', true)
        ->orderBy('name')
        ->get(['id', 'name', 'unit', 'cost'])
        ->map(fn ($m) => [
            'id'   => $m->id,
            'name' => $m->name,
            'unit' => $m->unit,
            'cost' => (float) $m->cost,
        ])
        ->values();
}






    //======================================================================================================================================================================================================================================

    /* ═══════════════════════════════════════════════════════════════
     *  PER-UNIT MATERIAL REQUIREMENTS (single source of truth)
     * ═══════════════════════════════════════════════════════════════
     *
     *  Returns [material_id => quantity_per_unit] for a product.
     *
     *  - Customizable products:
     *        Uses MaterialCalculationService with each part's STANDARD
     *        dimensions (falling back to the product-level standard_*
     *        values when a part doesn't define its own). This produces
     *        the correct board-feet / linear-feet / fixed requirements
     *        exactly as if a customer had ordered the standard size.
     *
     *  - Non-customizable products:
     *        Uses the pivot `quantity` directly — the admin entered the
     *        per-unit material amount explicitly on the product form.
     */
    /* ═══════════════════════════════════════════════════════════════
 *  PER-UNIT MATERIAL REQUIREMENTS (single source of truth)
 * ═══════════════════════════════════════════════════════════════
 *
 *  The BOM pivot `quantity` IS the per-unit material amount. The
 *  admin enters it once in Admin → Products → Bill of Materials.
 *
 *  This applies to BOTH customizable and non-customizable products.
 *  The difference is what happens AFTER the initial stock:
 *
 *    - Non-customizable → the pivot quantity is the whole story.
 *
 *    - Customizable     → the pivot quantity covers the STANDARD size.
 *                         When a customer orders a customized (larger)
 *                         size, CustomizationPricingService computes
 *                         the EXTRA material cost on top and bills it
 *                         as a surcharge.
 *
 *  Parts are metadata for the customization wizard; they do NOT
 *  drive the base BOM deduction. Any per-part math belongs inside
 *  CustomizationPricingService, not here.
 */
private function getPerUnitMaterialRequirements(Product $product): array
{
    if (!$product->relationLoaded('materials')) {
        $product->load('materials');
    }

    $perUnit = [];
    foreach ($product->materials as $material) {
        $perUnit[$material->id] = (float) $material->pivot->quantity;
    }

    return $perUnit;
}
    /**
     * Deduct (or add back) materials from inventory based on product
     * stock change. Handles BOTH customizable and non-customizable
     * products — the per-unit amount is resolved by
     * getPerUnitMaterialRequirements().
     */
    private function deductMaterialsForStock(Product $product, int $oldStock = 0)  // ← CHANGED
    {
        Log::info('🚀 [DEDUCT] Starting deductMaterialsForStock', [
            'product_id'      => $product->id,
            'product_name'    => $product->name,
            'old_stock'       => $oldStock,
            'new_stock'       => $product->stock_quantity,
            'is_customizable' => $product->is_customizable,
        ]);

        // ⚠️ The previous "skip for customizable" early-return is REMOVED.
        // Customizable products now go through the same deduction logic
        // as non-customizable ones, using standard dimensions as the BOM.

        $newStock = $product->stock_quantity;
        $delta    = $newStock - $oldStock;

        Log::info('📊 [DEDUCT] Stock delta calculated', [
            'delta' => $delta,
            'mode'  => $product->is_customizable
                ? 'customizable (standard dims)'
                : 'non-customizable (pivot quantity)',
        ]);

        if ($delta == 0) {
            Log::info('⏭️ [DEDUCT] Delta is zero – no stock change, skipping deduction.');
            return;
        }

        // Resolve per-unit requirements (this is the key fix)
        $perUnit = $this->getPerUnitMaterialRequirements($product);

        Log::info('📦 [DEDUCT] Per-unit material requirements resolved', [
            'count' => count($perUnit),
            'per_unit' => $perUnit,
        ]);

        if (empty($perUnit)) {
            Log::info('⏭️ [DEDUCT] No material requirements found – nothing to deduct.');
            return;
        }

        // Build the per-material total required for the stock delta
        $materialQuantities = [];
        foreach ($product->materials as $material) {
            $qtyPerUnit = (float) ($perUnit[$material->id] ?? 0);
            if ($qtyPerUnit <= 0) {
                continue;
            }

            $required = $qtyPerUnit * $delta;

            $materialQuantities[$material->id] = [
                'required'  => $required,
                'available' => (float) $material->stock_quantity,
                'name'      => $material->name,
            ];
        }

        Log::info('🧮 [DEDUCT] Calculated material requirements', [
            'quantities' => $materialQuantities,
        ]);

        if (empty($materialQuantities)) {
            Log::info('⏭️ [DEDUCT] No positive material requirements – nothing to deduct.');
            return;
        }

        // Pre-validation: check if any material would go negative
        $insufficient = [];
        foreach ($materialQuantities as $materialId => $data) {
            $required = $data['required'];
            if ($required > 0 && $data['available'] - $required < 0) {
                $insufficient[] = [
                    'name'      => $data['name'],
                    'required'  => $required,
                    'available' => $data['available'],
                    'deficit'   => $required - $data['available'],
                ];
            }
        }

        if (!empty($insufficient)) {
            $errorMessage = "Insufficient stock for the following materials:\n";
            foreach ($insufficient as $item) {
                $errorMessage .= "- {$item['name']}: Required {$item['required']}, Available {$item['available']} (Short by {$item['deficit']})\n";
            }
            Log::error('❌ [DEDUCT] Validation failed – insufficient stock', ['errors' => $errorMessage]);
            throw new \Exception($errorMessage);
        }

        Log::info('✅ [DEDUCT] Stock validation passed – proceeding with deduction.');

        DB::beginTransaction();
        try {
            foreach ($materialQuantities as $materialId => $data) {
                $material = Material::findOrFail($materialId);
                $required = $data['required'];
                $previousQuantity = $material->stock_quantity;
                $newQuantity = $previousQuantity - $required;
                $quantityChange = -$required;

                Log::info('🔄 [DEDUCT] Updating material stock', [
                    'material' => $material->name,
                    'previous' => $previousQuantity,
                    'required' => $required,
                    'new'      => $newQuantity,
                    'change'   => $quantityChange,
                ]);

                $material->stock_quantity = $newQuantity;
                $material->save();

                StockHistory::create([
                    'material_id'       => $material->id,
                    'quantity_change'   => $quantityChange,
                    'previous_quantity' => $previousQuantity,
                    'new_quantity'      => $newQuantity,
                    'note'              => "Product '{$product->name}' stock change (Δ{$delta} units)",
                    'created_by'        => auth()->id(),
                    'reference_type'    => 'product',
                    'reference_id'      => $product->id,
                ]);

                Log::info('✅ [DEDUCT] Stock history entry created', [
                    'material'     => $material->name,
                    'history_note' => "Product '{$product->name}' stock change (Δ{$delta} units)",
                ]);
            }

            DB::commit();
            Log::info('🎉 [DEDUCT] Stock deduction completed successfully for product', [
                'product_id' => $product->id,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('💥 [DEDUCT] Stock deduction failed, transaction rolled back', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }


    private function validateVariantPricing(array $variants): void
    {
        $prices = [];
        foreach ($variants as $v) {
            $slug = strtolower($v['slug'] ?? '');
            if ($slug) {
                $prices[$slug] = (float) ($v['price'] ?? 0);
            }
        }

        if (isset($prices['ordinary'], $prices['standard'])) {
            if ($prices['ordinary'] >= $prices['standard']) {
                throw ValidationException::withMessages([
                    'variants' => 'The Ordinary variant must be cheaper than the Standard variant.',
                ]);
            }
        }
    }

  private function syncVariants(Product $product, array $variantsData, Request $request): void
{
    $existingIds = $product->variants->pluck('id')
        ->map(fn ($id) => (int) $id)
        ->toArray();

    $keepIds = [];

    foreach ($variantsData as $i => $v) {
        // ── Resolve the wood material this variant refers to ──
        $materialId = !empty($v['material_id']) ? (int) $v['material_id'] : null;
        $material   = $materialId ? Material::find($materialId) : null;

        // Wood-type name comes from the Material; slug auto-generates.
        // Fallbacks preserve legacy variants that had no material attached.
        $name = $material?->name ?? ($v['name'] ?? 'Wood Type');
        $slug = \Illuminate\Support\Str::slug($v['slug'] ?? $name) ?: ('wood-type-' . $i);

        $payload = [
            'material_id' => $material?->id,
            'name'        => $name,
            'slug'        => $slug,
            'price'       => $v['price'],
            'description' => $v['description'] ?? null,
            'is_active'   => array_key_exists('is_active', $v) ? (bool) $v['is_active'] : true,
            'sort_order'  => $v['sort_order'] ?? $i,
        ];

        $incomingId = !empty($v['id']) ? (int) $v['id'] : null;

        if ($incomingId && in_array($incomingId, $existingIds, true)) {
            // Existing wood type → update
            $variant = ProductVariant::find($incomingId);
            $variant->update($payload);
        } else {
            // New wood type → create
            $variant = $product->variants()->create($payload);
        }

        $keepIds[] = (int) $variant->id;

        // ── Remove variant images flagged for deletion ──
        if (!empty($v['delete_images'])) {
            $toDelete = ProductImage::where('variant_id', $variant->id)
                ->whereIn('id', $v['delete_images'])
                ->get();
            foreach ($toDelete as $img) {
                Storage::disk('public')->delete($img->path);
                $img->delete();
            }
        }

        // ── Upload new FINISHED-PRODUCT images for this wood type ──
        $files = $request->file("variants.{$i}.images");
        if (!empty($files)) {
            $existingCount = $variant->images()->count();
            foreach ($files as $idx => $file) {
                $path = $file->store('products/variants', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'variant_id' => $variant->id,
                    'path'       => $path,
                    'is_primary' => $existingCount === 0 && $idx === 0,
                    'sort_order' => $existingCount + $idx,
                ]);
            }
        }
    }

    // ── Delete wood types the admin removed from the form ──
    $toDelete = array_diff($existingIds, $keepIds);
    if (!empty($toDelete)) {
        ProductVariant::whereIn('id', $toDelete)->delete();
    }
}




    private function syncMaterials(Product $product, $materialsData = null)
    {
        if ($materialsData === null) {
            $product->materials()->sync([]);
            return;
        }

        $syncData = [];
        foreach ($materialsData as $mat) {
            $rule = $mat['calculation_rule'] ?? 'fixed';

            $syncData[$mat['id']] = [
                'quantity'         => $mat['quantity'] ?? 0,
                'unit'             => $mat['unit'] ?? null,
                'calculation_type' => $rule === 'fixed' ? 'fixed' : 'calculated',
                'calculation_rule' => $rule,
                'formula'          => $mat['formula'] ?? null,
                'is_finish'        => $mat['is_finish'] ?? false,
                'sort_order'       => $mat['sort_order'] ?? 0,
            ];
        }
        $product->materials()->sync($syncData);
    }
private function syncParts(Product $product, $partsData = null)
{
    if ($partsData === null) {
        $product->parts()->delete();
        return;
    }

    $existingIds = $product->parts->pluck('id')->toArray();
    $newIds = [];

    foreach ($partsData as $i => $part) {
        // ─── Normalize dimension bounds ───
        // Keep only bounds for dimensions that are actually enabled.
        $enabledFields = $part['dimension_fields'] ?? [];
        $rawBounds     = $part['dimension_bounds'] ?? [];
        $bounds        = [];

        if (is_array($rawBounds)) {
            foreach ($enabledFields as $field) {
                if (isset($rawBounds[$field])) {
                    $min = $rawBounds[$field]['min'] ?? null;
                    $max = $rawBounds[$field]['max'] ?? null;
                    if ($min !== null || $max !== null) {
                        $bounds[$field] = [
                            'min' => $min !== null ? (float) $min : null,
                            'max' => $max !== null ? (float) $max : null,
                        ];
                    }
                }
            }
        }

         // --- NEW: Normalize Dimension Pricing ---
        $rawPricing = $part['dimension_pricing'] ?? [];
        $pricing = [];
        if (is_array($rawPricing)) {
            foreach ($enabledFields as $field) {
                if (isset($rawPricing[$field]) && $rawPricing[$field] !== '' && $rawPricing[$field] !== null) {
                    $pricing[$field] = (float) $rawPricing[$field];
                }
            }
        }

        $payload = [
            'name'                   => $part['name'],
            'reference_image'        => $part['reference_image'] ?? null,
            'dimension_fields'       => $enabledFields,
            'is_customizable'        => (bool) ($part['is_customizable'] ?? false),
            'dimension_bounds'       => empty($bounds) ? null : $bounds,
            'dimension_pricing'      => empty($pricing) ? null : $pricing, // <-- NEW
            'allow_design_selection' => (bool) ($part['allow_design_selection'] ?? false),
            'standard_length'        => $part['standard_length']    ?? null,
            'standard_width'         => $part['standard_width']     ?? null,
            'standard_height'        => $part['standard_height']    ?? null,
            'standard_thickness'     => $part['standard_thickness'] ?? null,
            'standard_diameter'      => $part['standard_diameter']  ?? null,
            'standard_depth'         => $part['standard_depth']     ?? null,
            'sort_order'             => $part['sort_order'] ?? $i,
        ];

        // ─── Create or update the part row ───
        if (isset($part['id'])) {
            $partModel = ProductPart::where('id', $part['id'])
                ->where('product_id', $product->id)
                ->first();

            if ($partModel) {
                $partModel->update($payload);
            } else {
                $partModel = $product->parts()->create($payload);
            }
        } else {
            $partModel = $product->parts()->create($payload);
        }

        $newIds[] = $partModel->id;

        // ─── Sync designs for this part ───
        $this->syncPartDesigns(
            $partModel,
            $part['designs'] ?? [],
            $i
        );
    }

    // ─── Delete parts that were removed from the form ───
    $toDelete = array_diff($existingIds, $newIds);
    if (!empty($toDelete)) {
        ProductPart::whereIn('id', $toDelete)->delete();
    }
}

/**
 * Sync the design options for a single part.
 *
 * @param  ProductPart $partModel
 * @param  array       $designsData   Array of design entries from the form
 * @param  int         $partIndex     The part's index in the request (used for image file keys)
 */
    /**
     * Sync the design options for a single part.
     *
     * @param  ProductPart $partModel
     * @param  array       $designsData   Array of design entries from the form
     * @param  int         $partIndex     The part's index in the request (used for image file keys)
     */
    private function syncPartDesigns(ProductPart $partModel, array $designsData, int $partIndex): void
    {
        // If design selection is off, we still keep existing designs but mark
        // them inactive — that way turning the toggle back on restores them.
        if (!$partModel->allow_design_selection) {
            $partModel->designs()->update(['is_active' => false]);
            return;
        }

        $existingDesignIds = $partModel->designs->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->toArray();

        $keepIds = [];
        $defaultAssigned = false;

        foreach ($designsData as $j => $d) {
            // Image can be: (a) existing (kept)  (b) newly uploaded  (c) unchanged
            $newFile = request()->file("parts.{$partIndex}.designs.{$j}.image");

            // Skip empty design rows (no name and no image anywhere)
            $isExisting = !empty($d['id']) && in_array((int) $d['id'], $existingDesignIds, true);
            if (empty($d['name']) && !$newFile && !$isExisting && empty($d['existing_image_path'])) {
                continue;
            }

            // ─── FIX: Resolve the final image path ───
            // If there's an existing image path passed in the payload, use it.
            // Otherwise, if a new file was uploaded, store it.
            $imagePath = $d['existing_image_path'] ?? null;
            if ($newFile) {
                $imagePath = $newFile->store('products/parts/designs', 'public');
            }

            // If neither existing nor new image exists, skip this design
            if (empty($imagePath)) {
                continue;
            }

            // Determine is_default — only one design per part may be default.
            $wantsDefault = !empty($d['is_default']);
            $isDefault    = false;
            if ($wantsDefault && !$defaultAssigned) {
                $isDefault = true;
                $defaultAssigned = true;
            }

            // Force cost to 0 if it's the default design
            $additionalCost = $isDefault ? 0 : (float) ($d['additional_cost'] ?? 0);

            $payload = [
                'name'            => $d['name'] ?? 'Design',
                'image_path'      => $imagePath,
                'additional_cost' => $additionalCost,
                'is_default'      => $isDefault,
                'is_active'       => array_key_exists('is_active', $d) ? (bool) $d['is_active'] : true,
                'sort_order'      => $d['sort_order'] ?? $j,
            ];

            if ($isExisting) {
                $design = ProductPartDesign::find((int) $d['id']);
                // Delete the old file if the image changed
                if ($newFile && $design->image_path && $design->image_path !== $imagePath) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($design->image_path);
                }
                $design->update($payload);
            } else {
                $payload['product_part_id'] = $partModel->id;
                $design = ProductPartDesign::create($payload);
            }

            $keepIds[] = (int) $design->id;
        }

        // ─── If no design was marked default, promote the first active one ───
        if (!$defaultAssigned && count($keepIds) > 0) {
            ProductPartDesign::where('id', $keepIds[0])->update(['is_default' => true]);
        }

        // ─── Delete designs removed from the form ───
        $toDelete = array_diff($existingDesignIds, $keepIds);
        if (!empty($toDelete)) {
            $victims = ProductPartDesign::whereIn('id', $toDelete)->get();
            foreach ($victims as $v) {
                if ($v->image_path) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($v->image_path);
                }
                $v->delete();
            }
        }
    }




    private function sanitizeRequestData(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            if (str_contains(strtolower($key), 'password')) {
                $sanitized[$key] = '***REDACTED***';
                continue;
            }

            if ($value instanceof \Illuminate\Http\UploadedFile) {
                $sanitized[$key] = [
                    'uploaded_file' => true,
                    'name' => $value->getClientOriginalName(),
                    'size' => $value->getSize(),
                    'mime' => $value->getMimeType(),
                ];
                continue;
            }

            if (is_array($value)) {
                if (isset($value[0]) && $value[0] instanceof \Illuminate\Http\UploadedFile) {
                    $sanitized[$key] = array_map(function ($file) {
                        return [
                            'uploaded_file' => true,
                            'name' => $file->getClientOriginalName(),
                            'size' => $file->getSize(),
                            'mime' => $file->getMimeType(),
                        ];
                    }, $value);
                    continue;
                }

                $sanitized[$key] = array_map(function ($item) {
                    if (is_string($item) && strlen($item) > 500) {
                        return substr($item, 0, 500) . '... [TRUNCATED]';
                    }
                    return $item;
                }, $value);
                continue;
            }

            if (is_string($value) && strlen($value) > 500) {
                $sanitized[$key] = substr($value, 0, 500) . '... [TRUNCATED]';
                continue;
            }

            $sanitized[$key] = $value;
        }

        return $sanitized;
    }

    private function validateMaterialsStock(Product $product, int $stockQuantity): void
    {
        // ← CHANGED: use the same per-unit resolver as deductMaterialsForStock,
        //    so customizable products validate against their STANDARD-dim BOM
        //    rather than the raw pivot quantity.
        $perUnit = $this->getPerUnitMaterialRequirements($product);

        $requirements = [];
        foreach ($product->materials as $material) {
            $requirements[] = [
                'material_id'       => $material->id,
                'material_name'     => $material->name,
                'available'         => $material->stock_quantity,
                'quantity_per_unit' => (float) ($perUnit[$material->id] ?? 0),
            ];
        }

        if (empty($requirements)) {
            return;
        }

        $materialQuantities = [];
        foreach ($requirements as $req) {
            $materialId = $req['material_id'];
            $required = $req['quantity_per_unit'] * $stockQuantity;
            $materialQuantities[$materialId] = [
                'required'  => ($materialQuantities[$materialId]['required'] ?? 0) + $required,
                'available' => $req['available'],
                'name'      => $req['material_name'],
            ];
        }

        $insufficient = [];
        foreach ($materialQuantities as $materialId => $data) {
            $newQuantity = $data['available'] - $data['required'];
            if ($newQuantity < 0) {
                $insufficient[] = [
                    'name'      => $data['name'],
                    'required'  => $data['required'],
                    'available' => $data['available'],
                    'deficit'   => abs($newQuantity),
                ];
            }
        }

        if (!empty($insufficient)) {
            $errorMessage = "Cannot create product – insufficient stock for the following materials:\n";
            foreach ($insufficient as $item) {
                $errorMessage .= "- {$item['name']}: Required {$item['required']}, Available {$item['available']} (Short by {$item['deficit']})\n";
            }
            throw new \Exception($errorMessage);
        }
    }

    private function validateStandardSizesForCategory(int $categoryId, array $payload): void
    {
        $templates = ProductSizeTemplate::where('category_id', $categoryId)
            ->where('is_active', true)
            ->get();

        if ($templates->isEmpty()) {
            return;
        }

        $incoming = [
            'length'    => $payload['standard_length']    ?? null,
            'width'     => $payload['standard_width']     ?? null,
            'height'    => $payload['standard_height']    ?? null,
            'thickness' => $payload['standard_thickness'] ?? null,
            'diameter'  => $payload['standard_diameter']  ?? null,
            'depth'     => $payload['standard_depth']     ?? null,
        ];

        $hasAnyValue = collect($incoming)
            ->filter(fn ($v) => $v !== null && $v !== '')
            ->isNotEmpty();

        $unit = config('units.dimension');

        if (!$hasAnyValue) {
            throw ValidationException::withMessages([
                'standard_length' => "This category uses fixed sizes (in {$unit}). Please select a standard size before saving.",
            ]);
        }

        $normalize = fn ($v) => $v === null || $v === '' ? null : (float) $v;

        $matched = $templates->first(function ($t) use ($incoming, $normalize) {
            return $normalize($t->length)    === $normalize($incoming['length'])
                && $normalize($t->width)     === $normalize($incoming['width'])
                && $normalize($t->height)    === $normalize($incoming['height'])
                && $normalize($t->thickness) === $normalize($incoming['thickness'])
                && $normalize($t->diameter)  === $normalize($incoming['diameter'])
                && $normalize($t->depth)     === $normalize($incoming['depth']);
        });

        if (!$matched) {
            throw ValidationException::withMessages([
                'standard_length' => "The selected dimensions do not match any of the allowed standard sizes for this category. All dimensions are in {$unit}. Please choose one of the predefined sizes.",
            ]);
        }
    }

    private function validatePartStandards(array $parts): void
    {
        $errors = [];
        $unit   = config('units.dimension');

        foreach ($parts as $i => $part) {
            $fields = $part['dimension_fields'] ?? [];

            foreach ($fields as $field) {
                $key   = 'standard_' . strtolower($field);
                $value = $part[$key] ?? null;

                if ($value === null || $value === '') {
                    $errors["parts.{$i}.{$key}"] =
                        "Standard {$field} (in {$unit}) is required for this part because the customer can customize it.";
                }
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }
}
