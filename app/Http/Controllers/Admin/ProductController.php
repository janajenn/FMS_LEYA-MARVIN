<?php

namespace App\Http\Controllers\Admin;

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
use App\Models\ProductSizeTemplate;   // ← NEW
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with(['category', 'images'])->get();
        return Inertia::render('Admin/Products/Index', ['products' => $products]);
    }

public function create()
{
    $categories      = ProductCategory::all();
    $materials       = Material::all();
    $finishMaterials = Material::where('is_finish', true)->orderBy('name')->get();

    // Group templates by category_id so the frontend can look them up
    // with `sizeTemplates[category_id]` in one pass.
    $sizeTemplates = ProductSizeTemplate::where('is_active', true)
        ->orderBy('sort_order')
        ->get()
        ->groupBy('category_id');

    return Inertia::render('Admin/Products/Create', [
        'categories'      => $categories,
        'materials'       => $materials,
        'finishMaterials' => $finishMaterials,
        'sizeTemplates'   => $sizeTemplates,   // ← NEW
    ]);
}

    /**
     * Deduct (or add back) materials from inventory based on product stock change.
     * Now uses only $product->materials (unified, includes finishes).
     */
  private function deductMaterialsForStock(Product $product, int $oldStock = 0)
{
    Log::info('🚀 [DEDUCT] Starting deductMaterialsForStock', [
        'product_id' => $product->id,
        'product_name' => $product->name,
        'old_stock' => $oldStock,
        'new_stock' => $product->stock_quantity,
        'is_customizable' => $product->is_customizable,
    ]);

    // Skip for customizable products – log and return
    if ($product->is_customizable) {
        Log::info('⏭️ [DEDUCT] Skipping deduction – product is customizable (deduction handled at order time).');
        return;
    }

    $newStock = $product->stock_quantity;
    $delta = $newStock - $oldStock;

    Log::info('📊 [DEDUCT] Stock delta calculated', ['delta' => $delta]);

    if ($delta == 0) {
        Log::info('⏭️ [DEDUCT] Delta is zero – no stock change, skipping deduction.');
        return;
    }

    // Gather requirements from unified materials (BOM + finishes)
    $requirements = [];
    foreach ($product->materials as $material) {
        $requirements[] = [
            'material_id' => $material->id,
            'material_name' => $material->name,
            'available' => $material->stock_quantity,
            'quantity_per_unit' => $material->pivot->quantity,
        ];
    }

    Log::info('📦 [DEDUCT] Raw material requirements gathered', [
        'count' => count($requirements),
        'requirements' => $requirements,
    ]);

    if (empty($requirements)) {
        Log::info('⏭️ [DEDUCT] No materials found for product – nothing to deduct.');
        return;
    }

    // Calculate total required per material (positive = need to deduct)
    $materialQuantities = [];
    foreach ($requirements as $req) {
        $materialId = $req['material_id'];
        $required = $req['quantity_per_unit'] * $delta;
        if (!isset($materialQuantities[$materialId])) {
            $materialQuantities[$materialId] = [
                'required' => 0,
                'available' => $req['available'],
                'name' => $req['material_name'],
            ];
        }
        $materialQuantities[$materialId]['required'] += $required;
    }

    Log::info('🧮 [DEDUCT] Calculated material requirements per unit', [
        'quantities' => $materialQuantities,
    ]);

    // Pre-validation: check if any material would go negative
    $insufficient = [];
    foreach ($materialQuantities as $materialId => $data) {
        $required = $data['required'];
        if ($required > 0 && $data['available'] - $required < 0) {
            $insufficient[] = [
                'name' => $data['name'],
                'required' => $required,
                'available' => $data['available'],
                'deficit' => $required - $data['available'],
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
            $newQuantity = $previousQuantity - $required; // subtract required (positive) or add if negative
            $quantityChange = -$required; // negative for deduction, positive for addition

            Log::info('🔄 [DEDUCT] Updating material stock', [
                'material' => $material->name,
                'previous' => $previousQuantity,
                'required' => $required,
                'new' => $newQuantity,
                'change' => $quantityChange,
            ]);

            $material->stock_quantity = $newQuantity;
            $material->save();

            StockHistory::create([
                'material_id' => $material->id,
                'quantity_change' => $quantityChange,
                'previous_quantity' => $previousQuantity,
                'new_quantity' => $newQuantity,
                'note' => "Product '{$product->name}' stock change (Δ{$delta} units)",
                'created_by' => auth()->id(),
                'reference_type' => 'product',
                'reference_id' => $product->id,
            ]);

            Log::info('✅ [DEDUCT] Stock history entry created', [
                'material' => $material->name,
                'history_note' => "Product '{$product->name}' stock change (Δ{$delta} units)",
            ]);
        }

        DB::commit();
        Log::info('🎉 [DEDUCT] Stock deduction completed successfully for product', ['product_id' => $product->id]);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('💥 [DEDUCT] Stock deduction failed, transaction rolled back', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        throw $e;
    }
}

    /**
     * Store a new product with enhanced error handling and logging.
     */
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
            'description'    => 'required|string',
            'price'          => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'is_customizable'=> 'boolean',
            'status'         => 'required|in:active,inactive',
            'images'         => 'nullable|array',
            'images.*'       => 'image|max:2048',

            // ─── Materials / Parts ───
            'materials'      => 'nullable|array',
            'materials.*.id' => 'required_with:materials|exists:materials,id',
            'materials.*.quantity' => 'required_with:materials|numeric|min:0',
            'materials.*.unit'     => 'nullable|string',
            'materials.*.calculation_type' => 'sometimes|in:fixed,calculated',
            'materials.*.calculation_rule' => 'nullable|in:fixed,board_feet,surface_area_coverage,linear_feet,custom',
            'materials.*.formula'          => 'nullable|string',
            'materials.*.coverage_rate'    => 'nullable|numeric|min:0',
            'materials.*.is_finish'        => 'sometimes|boolean',
            'materials.*.sort_order'       => 'nullable|integer',

            'parts'          => 'required_if:is_customizable,true|array|min:1',
            'parts.*.name'   => 'required_if:is_customizable,true|string|max:255',
            'parts.*.reference_image' => 'nullable|string',
            'parts.*.dimension_fields' => 'required_if:is_customizable,true|array|min:1',
            'parts.*.dimension_fields.*' => 'string|in:Length,Width,Height,Thickness,Diameter,Depth',
            'parts.*.sort_order' => 'nullable|integer',

            'standard_length'    => 'required_if:is_customizable,true|nullable|numeric|min:0',
            'standard_width'     => 'required_if:is_customizable,true|nullable|numeric|min:0',
            'standard_height'    => 'required_if:is_customizable,true|nullable|numeric|min:0',
            'standard_thickness' => 'nullable|numeric|min:0',
            'standard_diameter'  => 'nullable|numeric|min:0',
            'standard_depth'     => 'nullable|numeric|min:0',
            'customization_markup_percent' => 'nullable|numeric|min:0|max:500',

            // ─── Variants ───
            'variants'                     => 'nullable|array|max:10',
            'variants.*.name'              => 'required_with:variants|string|max:255',
            'variants.*.slug'              => 'required_with:variants|string|max:50',
            'variants.*.price'             => 'required_with:variants|numeric|min:0',
            'variants.*.description'       => 'nullable|string',
            'variants.*.is_active'         => 'sometimes|boolean',
            'variants.*.sort_order'        => 'nullable|integer',
            'variants.*.images'            => 'nullable|array',
            'variants.*.images.*'          => 'image|max:2048',

            // ─── Labor ───
            'labor_cost'            => 'nullable|numeric|min:0',
            'estimated_labor_hours' => 'nullable|numeric|min:0',
        ]);

        // ─── STRICT size-template enforcement ───
        $this->validateStandardSizesForCategory($validated['category_id'], $validated);

        // Custom rule: Ordinary must be cheaper than Standard
        $this->validateVariantPricing($validated['variants'] ?? []);

        DB::beginTransaction();

        // ─── Create product ───
        $product = Product::create($validated);

        // ─── Base product images ───
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $file) {
                $path = $file->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'variant_id' => null,
                    'path'       => $path,
                    'is_primary' => $index === 0,
                    'sort_order' => $index,
                ]);
            }
        }

        // ─── Variants + variant images ───
        $this->syncVariants($product, $validated['variants'] ?? [], $request);

        // ─── Materials / Parts ───
        if ($request->has('materials')) {
            $this->syncMaterials($product, $request->input('materials'));
        }
        if ($request->has('parts') && $request->input('is_customizable')) {
            $this->syncParts($product, $request->input('parts'));
        }

        $product->load(['materials']);

        if ($product->stock_quantity > 0) {
            $this->validateMaterialsStock($product, $product->stock_quantity);
        }
        if (!$product->is_customizable && $product->stock_quantity > 0) {
            $this->deductMaterialsForStock($product, 0);
        }

        DB::commit();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product created successfully.');

    } catch (ValidationException $e) {
        DB::rollBack();
        return back()->withInput()->withErrors($e->errors());
    } catch (QueryException $e) {
        DB::rollBack();
        Log::error('Product creation database error', ['message' => $e->getMessage()]);
        return back()->withInput()
            ->withErrors(['error' => 'A database error occurred. Please try again.']);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Product creation failed', ['message' => $e->getMessage()]);
        return back()->withInput()->withErrors(['error' => $e->getMessage()]);
    }
}



/**
 * Enforce: Ordinary price must be strictly lower than Standard price.
 * Only enforced when both variants are present.
 */
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

/**
 * Sync variants + their images. Handles create and update in one pass.
 * New images are read from $request->file("variants.{i}.images").
 */
private function syncVariants(Product $product, array $variantsData, Request $request): void
{
    // Cast existing IDs to int once so comparisons are safe
    $existingIds = $product->variants->pluck('id')
        ->map(fn ($id) => (int) $id)
        ->toArray();

    $keepIds = [];

    foreach ($variantsData as $i => $v) {
        $payload = [
            'name'        => $v['name'],
            'slug'        => $v['slug'],
            'price'       => $v['price'],
            'description' => $v['description'] ?? null,
            'is_active'   => array_key_exists('is_active', $v) ? (bool) $v['is_active'] : true,
            'sort_order'  => $v['sort_order'] ?? $i,
        ];

        // Cast the incoming id to int — multipart payloads deliver it as a string
        $incomingId = !empty($v['id']) ? (int) $v['id'] : null;

        if ($incomingId && in_array($incomingId, $existingIds, true)) {
            // Existing variant → update
            $variant = ProductVariant::find($incomingId);
            $variant->update($payload);
        } else {
            // New variant → create
            $variant = $product->variants()->create($payload);
        }

        $keepIds[] = (int) $variant->id;

        // Remove variant images flagged for deletion
        if (!empty($v['delete_images'])) {
            $toDelete = ProductImage::where('variant_id', $variant->id)
                ->whereIn('id', $v['delete_images'])
                ->get();
            foreach ($toDelete as $img) {
                Storage::disk('public')->delete($img->path);
                $img->delete();
            }
        }

        // Upload new variant images
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

    // Delete variants the admin removed from the form
    $toDelete = array_diff($existingIds, $keepIds);
    if (!empty($toDelete)) {
        ProductVariant::whereIn('id', $toDelete)->delete();
    }
}


public function edit(Product $product)
{
    $categories      = ProductCategory::all();
    $materials       = Material::all();
    $finishMaterials = Material::where('is_finish', true)->orderBy('name')->get();

    $product->load(['images', 'materials', 'parts', 'variants.images']);

    $sizeTemplates = ProductSizeTemplate::where('is_active', true)
        ->orderBy('sort_order')
        ->get()
        ->groupBy('category_id');

    return Inertia::render('Admin/Products/Edit', [
        'product'         => $product,
        'categories'      => $categories,
        'materials'       => $materials,
        'finishMaterials' => $finishMaterials,
        'sizeTemplates'   => $sizeTemplates,   // ← NEW
    ]);
}



    /**
     * Update an existing product with enhanced error handling and logging.
     */
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
            'price'          => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'is_customizable'=> 'sometimes|boolean',
            'status'         => 'nullable|in:active,inactive',

            // ─── Product images ───
            'images'         => 'nullable|array',
            'images.*'       => 'image|max:2048',
            'delete_images'  => 'nullable|array',
            'delete_images.*'=> 'exists:product_images,id',

            // ─── Materials ───
            'materials'      => 'nullable|array',
            'materials.*.id' => 'required_with:materials|exists:materials,id',
            'materials.*.quantity'         => 'nullable|numeric|min:0',
            'materials.*.unit'             => 'nullable|string',
            'materials.*.calculation_type' => 'nullable|in:fixed,calculated',
            'materials.*.calculation_rule' => 'nullable|in:fixed,board_feet,surface_area_coverage,linear_feet,custom',
            'materials.*.formula'          => 'nullable|string',
            'materials.*.coverage_rate'    => 'nullable|numeric|min:0',
            'materials.*.is_finish'        => 'sometimes|boolean',
            'materials.*.sort_order'       => 'nullable|integer',

            // ─── Parts ───
            'parts'          => 'nullable|array',
            'parts.*.name'   => 'required_with:parts|string|max:255',
            'parts.*.reference_image'    => 'nullable|string',
            'parts.*.dimension_fields'   => 'required_with:parts|array',
            'parts.*.dimension_fields.*' => 'string|in:Length,Width,Height,Thickness,Diameter,Depth',
            'parts.*.sort_order'         => 'nullable|integer',

            // ─── Standard dimensions ───
            'standard_length'    => 'nullable|numeric|min:0',
            'standard_width'     => 'nullable|numeric|min:0',
            'standard_height'    => 'nullable|numeric|min:0',
            'standard_thickness' => 'nullable|numeric|min:0',
            'standard_diameter'  => 'nullable|numeric|min:0',
            'standard_depth'     => 'nullable|numeric|min:0',
            'customization_markup_percent' => 'nullable|numeric|min:0|max:500',

            // ─── Variants ───
            'variants'                    => 'nullable|array|max:10',
            'variants.*.id'               => 'nullable|integer|exists:product_variants,id',
            'variants.*.name'             => 'required_with:variants|string|max:255',
            'variants.*.slug'             => 'required_with:variants|string|max:50',
            'variants.*.price'            => 'required_with:variants|numeric|min:0',
            'variants.*.description'      => 'nullable|string',
            'variants.*.is_active'        => 'sometimes|boolean',
            'variants.*.sort_order'       => 'nullable|integer',
            'variants.*.images'           => 'nullable|array',
            'variants.*.images.*'         => 'image|max:2048',
            'variants.*.delete_images'    => 'nullable|array',
            'variants.*.delete_images.*'  => 'integer|exists:product_images,id',

            // ─── Labor ───
            'labor_cost'            => 'nullable|numeric|min:0',
            'estimated_labor_hours' => 'nullable|numeric|min:0',
        ]);

        // ─── STRICT size-template enforcement ───
        $categoryForValidation = $validated['category_id'] ?? $product->category_id;
        $this->validateStandardSizesForCategory($categoryForValidation, $validated);

        // Custom rule: Ordinary must be cheaper than Standard
        $this->validateVariantPricing($validated['variants'] ?? []);

        DB::beginTransaction();

        $oldStock = $product->stock_quantity;

        $product->update($validated);

        // ─── Delete base product images ───
        if ($request->has('delete_images')) {
            $toDelete = ProductImage::whereIn('id', $request->input('delete_images'))
                ->whereNull('variant_id')
                ->get();
            foreach ($toDelete as $img) {
                Storage::disk('public')->delete($img->path);
                $img->delete();
            }
            Log::info('Product images deleted', array_merge($logContext, [
                'deleted_count' => count($toDelete),
            ]));
        }

        // ─── Upload new base product images ───
        if ($request->hasFile('images')) {
            $existingCount = $product->images()->whereNull('variant_id')->count();
            foreach ($request->file('images') as $index => $file) {
                $path = $file->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'variant_id' => null,
                    'path'       => $path,
                    'is_primary' => $existingCount === 0 && $index === 0,
                    'sort_order' => $existingCount + $index,
                ]);
            }
            Log::info('New product images uploaded', array_merge($logContext, [
                'count' => count($request->file('images')),
            ]));
        }

        // ─── Sync variants + their images ───
        $this->syncVariants($product, $validated['variants'] ?? [], $request);
        Log::info('Variants synced', array_merge($logContext, [
            'variants_count' => count($validated['variants'] ?? []),
        ]));

        // ─── Sync materials ───
        if ($request->has('materials')) {
            $this->syncMaterials($product, $request->input('materials'));
        } else {
            $this->syncMaterials($product, null);
        }

        // ─── Sync parts ───
        if ($request->has('parts') && $request->input('is_customizable')) {
            $this->syncParts($product, $request->input('parts'));
        } else {
            $this->syncParts($product, null);
        }

        // RELOAD relationships after sync
        $product->load(['materials']);

        // ─── Validate stock ───
        if ($product->stock_quantity > 0) {
            $this->validateMaterialsStock($product, $product->stock_quantity);
            Log::info('Stock validation passed for update', array_merge($logContext, [
                'product_id' => $product->id,
            ]));
        }

        // ─── Deduct / add for standard products ───
        if (!$product->is_customizable) {
            $this->deductMaterialsForStock($product, $oldStock);
            Log::info('Materials adjusted for stock change', array_merge($logContext, [
                'product_id' => $product->id,
                'delta'      => $product->stock_quantity - $oldStock,
            ]));
        }

        DB::commit();

        return redirect()->route('admin.products.index')
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

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Product update failed', array_merge($logContext, [
            'message' => $e->getMessage(),
            'code'    => $e->getCode(),
            'file'    => $e->getFile(),
            'line'    => $e->getLine(),
        ]));
        return back()->withInput()
            ->withErrors(['error' => $e->getMessage()]);
    }
}



   public function destroy(Product $product)
{
    // Check if product has existing order items (prevent deletion)
    $hasOrders = \App\Models\OrderItem::where('product_id', $product->id)->exists();
    if ($hasOrders) {
        return redirect()->route('admin.products.index')
            ->with('error', 'Cannot delete product with existing orders.');
    }

    DB::beginTransaction();
    try {
        // Delete product images
        foreach ($product->images as $img) {
            Storage::disk('public')->delete($img->path);
        }
        $product->images()->delete();

        // Delete cart items referencing this product
        \App\Models\Cart::where('product_id', $product->id)->delete();

        // Detach materials (BOM and finishes)
        $product->materials()->detach();

        // Delete furniture parts
        $product->parts()->delete();

        // Now delete the product itself
        $product->delete();

        DB::commit();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Product deletion failed', ['error' => $e->getMessage()]);
        return redirect()->route('admin.products.index')
            ->with('error', 'Failed to delete product: ' . $e->getMessage());
    }
}



    /**
     * Sync unified materials (BOM + finishes) for a product.
     * If $materialsData is null, remove all associations.
     */
    private function syncMaterials(Product $product, $materialsData = null)
    {
        if ($materialsData === null) {
            $product->materials()->sync([]);
            return;
        }

        $syncData = [];
        foreach ($materialsData as $mat) {
            // If the frontend still sends 'is_finish' as a separate field, we respect it.
            // But we also treat all materials as unified; 'is_finish' is just a flag.
           $syncData[$mat['id']] = [
    'quantity' => $mat['quantity'] ?? 0,
    'unit' => $mat['unit'] ?? null,
    'calculation_type' => ($mat['calculation_rule'] ?? 'fixed') === 'fixed' ? 'fixed' : 'calculated',
    'calculation_rule' => $mat['calculation_rule'] ?? 'fixed',
    'formula' => $mat['formula'] ?? null,
    'coverage_rate' => $mat['coverage_rate'] ?? null,
    'is_finish' => $mat['is_finish'] ?? false,
    'sort_order' => $mat['sort_order'] ?? 0,
];


        }
        $product->materials()->sync($syncData);
    }

    /**
     * Sync furniture parts for a product.
     * If $partsData is null, remove all parts.
     */
    private function syncParts(Product $product, $partsData = null)
    {
        if ($partsData === null) {
            $product->parts()->delete();
            return;
        }

        $existingIds = $product->parts->pluck('id')->toArray();
        $newIds = [];

        foreach ($partsData as $part) {
            if (isset($part['id'])) {
                $partModel = ProductPart::where('id', $part['id'])
                            ->where('product_id', $product->id)
                            ->first();
                if ($partModel) {
                    $partModel->update([
                        'name' => $part['name'],
                        'reference_image' => $part['reference_image'] ?? null,
                        'dimension_fields' => $part['dimension_fields'] ?? [],
                        'sort_order' => $part['sort_order'] ?? 0,
                    ]);
                    $newIds[] = $partModel->id;
                } else {
                    $partModel = $product->parts()->create([
                        'name' => $part['name'],
                        'reference_image' => $part['reference_image'] ?? null,
                        'dimension_fields' => $part['dimension_fields'] ?? [],
                        'sort_order' => $part['sort_order'] ?? 0,
                    ]);
                    $newIds[] = $partModel->id;
                }
            } else {
                $partModel = $product->parts()->create([
                    'name' => $part['name'],
                    'reference_image' => $part['reference_image'] ?? null,
                    'dimension_fields' => $part['dimension_fields'] ?? [],
                    'sort_order' => $part['sort_order'] ?? 0,
                ]);
                $newIds[] = $partModel->id;
            }
        }

        $toDelete = array_diff($existingIds, $newIds);
        if (!empty($toDelete)) {
            ProductPart::whereIn('id', $toDelete)->delete();
        }
    }

    /**
     * Sanitize request data by removing sensitive fields and truncating large files.
     */
    private function sanitizeRequestData(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            // Skip password fields
            if (str_contains(strtolower($key), 'password')) {
                $sanitized[$key] = '***REDACTED***';
                continue;
            }

            // For image/file uploads, just note they were uploaded
            if ($value instanceof \Illuminate\Http\UploadedFile) {
                $sanitized[$key] = [
                    'uploaded_file' => true,
                    'name' => $value->getClientOriginalName(),
                    'size' => $value->getSize(),
                    'mime' => $value->getMimeType(),
                ];
                continue;
            }

            // Handle arrays recursively
            if (is_array($value)) {
                // For arrays of files (like product images)
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

                // Truncate long strings in arrays (like base64 images)
                $sanitized[$key] = array_map(function ($item) {
                    if (is_string($item) && strlen($item) > 500) {
                        return substr($item, 0, 500) . '... [TRUNCATED]';
                    }
                    return $item;
                }, $value);
                continue;
            }

            // Truncate long strings (base64 images, etc.)
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
        // Gather all material requirements from BOM + finishes
        $requirements = [];

        foreach ($product->materials as $material) {
            $requirements[] = [
                'material_id' => $material->id,
                'material_name' => $material->name,
                'available' => $material->stock_quantity,
                'quantity_per_unit' => $material->pivot->quantity,
            ];
        }

        // Finishes are already included in $product->materials (unified),
        // so we don't need a separate loop for finishes.

        if (empty($requirements)) {
            return; // No materials defined – nothing to validate
        }

        // Calculate total required per material for the given stock quantity
        $materialQuantities = [];
        foreach ($requirements as $req) {
            $materialId = $req['material_id'];
            $required = $req['quantity_per_unit'] * $stockQuantity;
            $materialQuantities[$materialId] = [
                'required' => ($materialQuantities[$materialId]['required'] ?? 0) + $required,
                'available' => $req['available'],
                'name' => $req['material_name'],
            ];
        }

        // Check if any material would go negative
        $insufficient = [];
        foreach ($materialQuantities as $materialId => $data) {
            $newQuantity = $data['available'] - $data['required'];
            if ($newQuantity < 0) {
                $insufficient[] = [
                    'name' => $data['name'],
                    'required' => $data['required'],
                    'available' => $data['available'],
                    'deficit' => abs($newQuantity),
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




        /**
     * ─── STRICT size-template enforcement ───
     *
     * If the product's category has any active size templates:
     *   - The product MUST have at least one standard dimension set.
     *   - The combination must match one of the templates exactly.
     *
     * If the category has no templates, the six `standard_*` fields are
     * allowed to be anything (current free-input behaviour).
     *
     * Throws ValidationException with a friendly message if the check fails.
     */
    private function validateStandardSizesForCategory(int $categoryId, array $payload): void
    {
        $templates = ProductSizeTemplate::where('category_id', $categoryId)
            ->where('is_active', true)
            ->get();

        // No templates → free-input mode, nothing to enforce
        if ($templates->isEmpty()) {
            return;
        }

        // Build a map of the incoming dimensions
        $incoming = [
            'length'    => $payload['standard_length']    ?? null,
            'width'     => $payload['standard_width']     ?? null,
            'height'    => $payload['standard_height']    ?? null,
            'thickness' => $payload['standard_thickness'] ?? null,
            'diameter'  => $payload['standard_diameter']  ?? null,
            'depth'     => $payload['standard_depth']     ?? null,
        ];

        // Reject empty submissions
        $hasAnyValue = collect($incoming)
            ->filter(fn ($v) => $v !== null && $v !== '')
            ->isNotEmpty();

        if (!$hasAnyValue) {
            throw ValidationException::withMessages([
                'standard_length' => 'This category uses fixed sizes. Please select a standard size before saving.',
            ]);
        }

        // Reject dimensions that don't match any preset exactly
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
                'standard_length' => 'The selected dimensions do not match any of the allowed standard sizes for this category. Please choose one of the predefined sizes.',
            ]);
        }
    }


}
