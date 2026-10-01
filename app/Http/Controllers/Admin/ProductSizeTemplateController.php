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
    /**
     * Shared units payload — single source of truth for the frontend.
     */
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
        $templates = ProductSizeTemplate::with('category')
            ->orderBy('category_id')
            ->orderBy('sort_order')
            ->get();

        $categories = ProductCategory::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/ProductSizeTemplates/Index', [
            'templates'  => $templates,
            'categories' => $categories,
            'units'      => $this->unitProps(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $template = ProductSizeTemplate::create($validated);

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
     * All dimension values are in INCHES — see config/units.php.
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

        $unit = config('units.dimension');

        $validator->after(function ($v) use ($request, $unit) {
            $hasAny = collect([
                $request->length, $request->width, $request->height,
                $request->thickness, $request->diameter, $request->depth,
            ])->filter(fn ($value) => $value !== null && $value !== '')->isNotEmpty();

            if (!$hasAny) {
                $v->errors()->add(
                    'length',
                    "Provide at least one dimension (values are in {$unit})."
                );
            }
        });

        return $validator->validate();
    }
}
