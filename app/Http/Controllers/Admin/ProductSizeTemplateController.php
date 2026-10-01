<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use App\Models\ProductSizeTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ProductSizeTemplateController extends Controller
{
    public function index()
    {
        $templates = ProductSizeTemplate::with('category')
            ->orderBy('category_id')
            ->orderBy('sort_order')
            ->get();

        $categories = ProductCategory::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/ProductSizeTemplates/Index', [
            'templates'  => $templates,
            'categories' => $categories,
        ]);
    }

   public function store(Request $request)
{
    $validated = $this->validatePayload($request);

    $template = ProductSizeTemplate::create($validated);

    // Sanity check — if category_id was dropped, throw instead of
    // silently creating an orphaned template.
    if (empty($template->category_id)) {
        \Log::error('Size template created without category_id', [
            'validated' => $validated,
            'template'  => $template->toArray(),
        ]);
        throw new \RuntimeException(
            'The size template was created without a category. Check $fillable on ProductSizeTemplate.'
        );
    }

    return back()->with('success', 'Size template added.');
}

public function update(Request $request, ProductSizeTemplate $productSizeTemplate)
{
    $validated = $this->validatePayload($request);

    $productSizeTemplate->update($validated);

    return back()->with('success', 'Size template updated.');
}

    public function destroy(ProductSizeTemplate $productSizeTemplate)
    {
        $productSizeTemplate->delete();

        return back()->with('success', 'Size template removed.');
    }

    /**
     * Shared validation. Requires category + label + at least one dimension.
     */
    private function validatePayload(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:product_categories,id',
            'label'       => 'required|string|max:255',
            'length'      => 'nullable|numeric|min:0',
            'width'       => 'nullable|numeric|min:0',
            'height'      => 'nullable|numeric|min:0',
            'thickness'   => 'nullable|numeric|min:0',
            'diameter'    => 'nullable|numeric|min:0',
            'depth'       => 'nullable|numeric|min:0',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'sometimes|boolean',
        ]);

        $validator->after(function ($v) use ($request) {
            $hasAny = collect([
                $request->length, $request->width, $request->height,
                $request->thickness, $request->diameter, $request->depth,
            ])->filter(fn ($value) => $value !== null && $value !== '')->isNotEmpty();

            if (!$hasAny) {
                $v->errors()->add('length', 'Provide at least one dimension.');
            }
        });

        return $validator->validate();
    }
}
