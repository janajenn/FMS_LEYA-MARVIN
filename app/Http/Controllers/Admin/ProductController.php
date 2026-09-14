<?php

namespace App\Http\Controllers\Admin;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Material;
use App\Models\ProductImage;
use App\Models\ProductPart;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
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
        $categories = ProductCategory::all();
        $materials = Material::all();
        // Still pass finishMaterials for UI until we migrate the frontend
        $finishMaterials = Material::where('is_finish', true)->orderBy('name')->get();

        return Inertia::render('Admin/Products/Create', [
            'categories' => $categories,
            'materials' => $materials,
            'finishMaterials' => $finishMaterials,
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
            'method' => __METHOD__,
            'user_id' => auth()->id(),
            'user_role' => auth()->user()?->role?->slug,
            'timestamp' => now()->toDateTimeString(),
            'request_data' => $this->sanitizeRequestData($request->all()),
        ];

        try {
            $validated = $request->validate([
                'category_id' => 'required|exists:product_categories,id',
                'name' => 'required|string|max:255|unique:products',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'stock_quantity' => 'required|integer|min:0',
                'is_customizable' => 'boolean',
                'status' => 'required|in:active,inactive',
                'images' => 'nullable|array',
                'images.*' => 'image|max:2048',
                'materials' => 'nullable|array',
                'materials.*.id' => 'required_with:materials|exists:materials,id',
                'materials.*.quantity' => 'required_with:materials|numeric|min:0',
                'materials.*.unit' => 'nullable|string',
                'materials.*.calculation_type' => 'sometimes|in:fixed,calculated',
                'materials.*.formula' => 'required_if:materials.*.calculation_type,calculated|nullable|string',
                'materials.*.coverage_rate' => 'nullable|numeric|min:0',
                'materials.*.is_finish' => 'sometimes|boolean',
                'materials.*.sort_order' => 'nullable|integer',
                'parts' => 'required_if:is_customizable,true|array|min:1',
                'parts.*.name' => 'required_if:is_customizable,true|string|max:255',
                'parts.*.reference_image' => 'nullable|string',
                'parts.*.dimension_fields' => 'required_if:is_customizable,true|array|min:1',
                'parts.*.dimension_fields.*' => 'string|in:Length,Width,Height,Thickness,Diameter,Depth',
                'parts.*.sort_order' => 'nullable|integer',
            ]);

            DB::beginTransaction();

            $product = Product::create($validated);
            Log::info('Product created', array_merge($logContext, ['product_id' => $product->id]));

            // Handle images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $file) {
                    $path = $file->store('products', 'public');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'path' => $path,
                        'is_primary' => $index === 0,
                        'sort_order' => $index,
                    ]);
                }
                Log::info('Product images uploaded', array_merge($logContext, ['product_id' => $product->id, 'count' => count($request->file('images'))]));
            }

            // Sync unified materials (BOM + finishes)
            if ($request->has('materials')) {
                $this->syncMaterials($product, $request->input('materials'));
                Log::info('Materials synced', array_merge($logContext, ['product_id' => $product->id, 'materials_count' => count($request->input('materials'))]));
            }

            // Sync parts (only if customizable)
            if ($request->has('parts') && $request->input('is_customizable')) {
                $this->syncParts($product, $request->input('parts'));
                Log::info('Parts synced', array_merge($logContext, ['product_id' => $product->id, 'parts_count' => count($request->input('parts'))]));
            }

            // RELOAD relationships after sync so we have fresh pivot data
            $product->load(['materials']);

            // ============================================================
            // 🆕 VALIDATE STOCK FOR ALL PRODUCTS (including customizable)
            // ============================================================
            if ($product->stock_quantity > 0) {
                $this->validateMaterialsStock($product, $product->stock_quantity);
                Log::info('Stock validation passed', array_merge($logContext, ['product_id' => $product->id]));
            }

            // ============================================================
            // DEDUCT FOR STANDARD PRODUCTS ONLY
            // ============================================================
            if (!$product->is_customizable && $product->stock_quantity > 0) {
                $this->deductMaterialsForStock($product, 0);
                Log::info('Materials deducted for initial stock', array_merge($logContext, ['product_id' => $product->id, 'stock' => $product->stock_quantity]));
            }

            DB::commit();

            return redirect()->route('admin.products.index')
                ->with('success', 'Product created successfully.');

        } catch (ValidationException $e) {
            DB::rollBack();
            Log::warning('Product creation validation failed', [
                'controller' => __CLASS__,
                'method' => __METHOD__,
                'user_id' => auth()->id(),
                'user_role' => auth()->user()?->role?->slug,
                'errors' => $e->errors(),
                'request_data' => $this->sanitizeRequestData($request->all()),
            ]);
            return back()->withInput()->withErrors($e->errors());

        } catch (QueryException $e) {
            DB::rollBack();
            Log::error('Product creation database error', [
                'controller' => __CLASS__,
                'method' => __METHOD__,
                'user_id' => auth()->id(),
                'user_role' => auth()->user()?->role?->slug,
                'message' => $e->getMessage(),
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $this->sanitizeRequestData($request->all()),
            ]);
            return back()->withInput()
                ->withErrors(['error' => 'A database error occurred. Please try again.']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Product creation failed', [
                'controller' => __CLASS__,
                'method' => __METHOD__,
                'user_id' => auth()->id(),
                'user_role' => auth()->user()?->role?->slug,
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $this->sanitizeRequestData($request->all()),
            ]);
            return back()->withInput()
                ->withErrors(['error' => $e->getMessage()]);
        }
    }



    public function edit(Product $product)
    {
        $categories = ProductCategory::all();
        $materials = Material::all();
        // Still pass finishMaterials for UI until we migrate the frontend
        $finishMaterials = Material::where('is_finish', true)->orderBy('name')->get();
        $product->load(['images', 'materials', 'parts']); // removed 'finishes'

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'materials' => $materials,
            'finishMaterials' => $finishMaterials,
        ]);
    }

    /**
     * Update an existing product with enhanced error handling and logging.
     */
     public function update(Request $request, Product $product)
    {
        $logContext = [
            'controller' => __CLASS__,
            'method' => __METHOD__,
            'user_id' => auth()->id(),
            'user_role' => auth()->user()?->role?->slug,
            'product_id' => $product->id,
            'timestamp' => now()->toDateTimeString(),
            'request_data' => $this->sanitizeRequestData($request->all()),
        ];

        try {
            $validated = $request->validate([
                'category_id' => 'required|exists:product_categories,id',
                'name' => 'required|string|max:255|unique:products,name,' . $product->id,
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'stock_quantity' => 'required|integer|min:0',
                'is_customizable' => 'boolean',
                'status' => 'required|in:active,inactive',
                'images' => 'nullable|array',
                'images.*' => 'image|max:2048',
                'delete_images' => 'nullable|array',
                'delete_images.*' => 'exists:product_images,id',
                'materials' => 'nullable|array',
                'materials.*.id' => 'required_with:materials|exists:materials,id',
                'materials.*.quantity' => 'required_with:materials|numeric|min:0',
                'materials.*.unit' => 'nullable|string',
                'materials.*.calculation_type' => 'sometimes|in:fixed,calculated',
                'materials.*.formula' => 'required_if:materials.*.calculation_type,calculated|nullable|string',
                'materials.*.coverage_rate' => 'nullable|numeric|min:0',
                'materials.*.is_finish' => 'sometimes|boolean',
                'materials.*.sort_order' => 'nullable|integer',
                'parts' => 'required_if:is_customizable,true|array|min:1',
                'parts.*.name' => 'required_if:is_customizable,true|string|max:255',
                'parts.*.reference_image' => 'nullable|string',
                'parts.*.dimension_fields' => 'required_if:is_customizable,true|array|min:1',
                'parts.*.dimension_fields.*' => 'string|in:Length,Width,Height,Thickness,Diameter,Depth',
                'parts.*.sort_order' => 'nullable|integer',
            ]);

            DB::beginTransaction();

            $oldStock = $product->stock_quantity;

            $product->update($validated);

            // Delete images
            if ($request->has('delete_images')) {
                $toDelete = ProductImage::whereIn('id', $request->input('delete_images'))->get();
                foreach ($toDelete as $img) {
                    Storage::disk('public')->delete($img->path);
                    $img->delete();
                }
                Log::info('Product images deleted', array_merge($logContext, ['deleted_count' => count($toDelete)]));
            }

            // Upload new images
            if ($request->hasFile('images')) {
                $existingCount = $product->images()->count();
                foreach ($request->file('images') as $index => $file) {
                    $path = $file->store('products', 'public');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'path' => $path,
                        'is_primary' => $existingCount === 0 && $index === 0,
                        'sort_order' => $existingCount + $index,
                    ]);
                }
                Log::info('New product images uploaded', array_merge($logContext, ['count' => count($request->file('images'))]));
            }

            // Sync unified materials
            if ($request->has('materials')) {
                $this->syncMaterials($product, $request->input('materials'));
            } else {
                $this->syncMaterials($product, null);
            }

            // Sync parts
            if ($request->has('parts') && $request->input('is_customizable')) {
                $this->syncParts($product, $request->input('parts'));
            } else {
                $this->syncParts($product, null);
            }

            // RELOAD relationships after sync
            $product->load(['materials']);

            // ============================================================
            // 🆕 VALIDATE STOCK FOR ALL PRODUCTS (including customizable)
            // ============================================================
            if ($product->stock_quantity > 0) {
                $this->validateMaterialsStock($product, $product->stock_quantity);
                Log::info('Stock validation passed for update', array_merge($logContext, ['product_id' => $product->id]));
            }

            // ============================================================
            // DEDUCT / ADD FOR STANDARD PRODUCTS ONLY
            // ============================================================
            if (!$product->is_customizable) {
                $this->deductMaterialsForStock($product, $oldStock);
                Log::info('Materials adjusted for stock change', array_merge($logContext, ['product_id' => $product->id, 'delta' => $product->stock_quantity - $oldStock]));
            }

            DB::commit();

            return redirect()->route('admin.products.index')
                ->with('success', 'Product updated successfully.');

        } catch (ValidationException $e) {
            DB::rollBack();
            Log::warning('Product update validation failed', [
                'controller' => __CLASS__,
                'method' => __METHOD__,
                'user_id' => auth()->id(),
                'user_role' => auth()->user()?->role?->slug,
                'product_id' => $product->id,
                'errors' => $e->errors(),
                'request_data' => $this->sanitizeRequestData($request->all()),
            ]);
            return back()->withInput()->withErrors($e->errors());

        } catch (QueryException $e) {
            DB::rollBack();
            Log::error('Product update database error', [
                'controller' => __CLASS__,
                'method' => __METHOD__,
                'user_id' => auth()->id(),
                'user_role' => auth()->user()?->role?->slug,
                'product_id' => $product->id,
                'message' => $e->getMessage(),
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $this->sanitizeRequestData($request->all()),
            ]);
            return back()->withInput()
                ->withErrors(['error' => 'A database error occurred. Please try again.']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Product update failed', [
                'controller' => __CLASS__,
                'method' => __METHOD__,
                'user_id' => auth()->id(),
                'user_role' => auth()->user()?->role?->slug,
                'product_id' => $product->id,
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $this->sanitizeRequestData($request->all()),
            ]);
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


}
