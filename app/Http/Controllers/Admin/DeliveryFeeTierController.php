<?php

namespace App\Http\Controllers\Admin;

use App\Models\Delivery;
use App\Models\DeliveryFeeTier;
use Illuminate\Database\Eloquent\MassAssignmentException;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Throwable;

class DeliveryFeeTierController extends Controller
{
    public function index()
    {
        Log::info('[DELIVERY TIER] index called', [
            'user_id' => auth()->id(),
            'total_tiers' => DeliveryFeeTier::count(),
        ]);

        return Inertia::render('Admin/DeliveryFeeTiers/Index', [
            'tiers' => DeliveryFeeTier::orderBy('min_distance_km')->get(),
            'storeLocation' => [
                'name'      => config('store.name'),
                'address'   => config('store.address'),
                'latitude'  => (float) config('store.latitude'),
                'longitude' => (float) config('store.longitude'),
            ],
        ]);
    }

    public function create()
    {
        $nextMin = (float) (DeliveryFeeTier::max('max_distance_km') ?? 0);

        Log::info('[DELIVERY TIER] create form opened', [
            'user_id'        => auth()->id(),
            'suggested_min'  => $nextMin,
        ]);

        return Inertia::render('Admin/DeliveryFeeTiers/Create', [
            'suggestedMinKm' => $nextMin,
        ]);
    }

    public function store(Request $request)
    {
        Log::info('[DELIVERY TIER] store called', [
            'user_id'  => auth()->id(),
            'incoming' => $request->only([
                'label', 'min_distance_km', 'max_distance_km',
                'fee', 'estimated_days', 'is_active', 'sort_order',
            ]),
            'fillable' => (new DeliveryFeeTier)->getFillable(),
        ]);

        // ── Validation ──
        try {
            $validated = $this->validateTier($request);
        } catch (ValidationException $e) {
            Log::warning('[DELIVERY TIER] store VALIDATION FAILED', [
                'errors' => $e->errors(),
                'input'  => $request->only([
                    'label', 'min_distance_km', 'max_distance_km',
                    'fee', 'estimated_days', 'is_active', 'sort_order',
                ]),
            ]);
            throw $e;
        }

        Log::info('[DELIVERY TIER] store validated', ['validated' => $validated]);

        // ── Insert ──
        try {
            $tier = DeliveryFeeTier::create($validated);
        } catch (MassAssignmentException $e) {
            Log::error('[DELIVERY TIER] store MASS ASSIGNMENT FAILED — check $fillable on model', [
                'message'  => $e->getMessage(),
                'fillable' => (new DeliveryFeeTier)->getFillable(),
                'attempted_keys' => array_keys($validated),
            ]);
            throw $e;
        } catch (QueryException $e) {
            Log::error('[DELIVERY TIER] store QUERY FAILED — check DB schema', [
                'message'  => $e->getMessage(),
                'sql'      => $e->getSql(),
                'bindings' => $e->getBindings(),
                'code'     => $e->getCode(),
            ]);
            throw $e;
        } catch (Throwable $e) {
            Log::error('[DELIVERY TIER] store UNKNOWN FAILED', [
                'exception' => get_class($e),
                'message'   => $e->getMessage(),
            ]);
            throw $e;
        }

        Log::info('[DELIVERY TIER] store SUCCESS', [
            'tier_id' => $tier->id,
            'row'     => $tier->only([
                'id', 'label', 'min_distance_km', 'max_distance_km',
                'fee', 'estimated_days', 'is_active', 'sort_order',
            ]),
        ]);

        return redirect()->route('admin.delivery-fee-tiers.index')->with('success', 'Tier created.');
    }

    public function edit(DeliveryFeeTier $tier)
    {
        Log::info('[DELIVERY TIER] edit form opened', [
            'user_id' => auth()->id(),
            'tier_id' => $tier->id,
            'row'     => $tier->only([
                'id', 'label', 'min_distance_km', 'max_distance_km',
                'fee', 'estimated_days', 'is_active', 'sort_order',
            ]),
        ]);

        return Inertia::render('Admin/DeliveryFeeTiers/Edit', ['tier' => $tier]);
    }

    public function update(Request $request, DeliveryFeeTier $tier)
    {
        Log::info('[DELIVERY TIER] update called', [
            'user_id'  => auth()->id(),
            'tier_id'  => $tier->id,
            'before'   => $tier->only([
                'id', 'label', 'min_distance_km', 'max_distance_km',
                'fee', 'estimated_days', 'is_active', 'sort_order',
            ]),
            'incoming' => $request->only([
                'label', 'min_distance_km', 'max_distance_km',
                'fee', 'estimated_days', 'is_active', 'sort_order',
            ]),
            'fillable' => (new DeliveryFeeTier)->getFillable(),
        ]);

        // ── Validation ──
        try {
            $validated = $this->validateTier($request, $tier->id);
        } catch (ValidationException $e) {
            Log::warning('[DELIVERY TIER] update VALIDATION FAILED', [
                'tier_id' => $tier->id,
                'errors'  => $e->errors(),
                'input'   => $request->only([
                    'label', 'min_distance_km', 'max_distance_km',
                    'fee', 'estimated_days', 'is_active', 'sort_order',
                ]),
            ]);
            throw $e;
        }

        Log::info('[DELIVERY TIER] update validated', [
            'tier_id'   => $tier->id,
            'validated' => $validated,
        ]);

        // ── Save ──
        try {
            $tier->update($validated);
        } catch (MassAssignmentException $e) {
            Log::error('[DELIVERY TIER] update MASS ASSIGNMENT FAILED — add missing field to $fillable', [
                'tier_id'        => $tier->id,
                'message'        => $e->getMessage(),
                'fillable'       => (new DeliveryFeeTier)->getFillable(),
                'attempted_keys' => array_keys($validated),
                'missing_keys'   => array_values(array_diff(
                    array_keys($validated),
                    (new DeliveryFeeTier)->getFillable()
                )),
            ]);
            throw $e;
        } catch (QueryException $e) {
            Log::error('[DELIVERY TIER] update QUERY FAILED — check DB schema', [
                'tier_id'  => $tier->id,
                'message'  => $e->getMessage(),
                'sql'      => $e->getSql(),
                'bindings' => $e->getBindings(),
                'code'     => $e->getCode(),
            ]);
            throw $e;
        } catch (Throwable $e) {
            Log::error('[DELIVERY TIER] update UNKNOWN FAILED', [
                'tier_id'   => $tier->id,
                'exception' => get_class($e),
                'message'   => $e->getMessage(),
            ]);
            throw $e;
        }

        $fresh = $tier->fresh();

        Log::info('[DELIVERY TIER] update SUCCESS', [
            'tier_id' => $tier->id,
            'after'   => $fresh?->only([
                'id', 'label', 'min_distance_km', 'max_distance_km',
                'fee', 'estimated_days', 'is_active', 'sort_order',
            ]),
            'changed' => $tier->wasChanged(),
        ]);

        return redirect()->route('admin.delivery-fee-tiers.index')->with('success', 'Tier updated.');
    }

    public function destroy(DeliveryFeeTier $tier)
    {
        $usageCount = Delivery::where('delivery_fee_tier_id', $tier->id)->count();

        Log::info('[DELIVERY TIER] destroy called', [
            'user_id'          => auth()->id(),
            'tier_id'          => $tier->id,
            'row'              => $tier->only([
                'id', 'label', 'min_distance_km', 'max_distance_km',
                'fee', 'estimated_days', 'is_active', 'sort_order',
            ]),
            'deliveries_using_this_tier' => $usageCount,
        ]);

        try {
            $tier->delete();
        } catch (QueryException $e) {
            $isFkBlock = $e->getCode() === '23000'
                || str_contains($e->getMessage(), 'foreign key')
                || str_contains($e->getMessage(), 'Integrity constraint');

            if ($isFkBlock) {
                Log::error('[DELIVERY TIER] destroy FK CONSTRAINT BLOCKED — tier in use, change FK to nullOnDelete', [
                    'tier_id'          => $tier->id,
                    'deliveries_count' => $usageCount,
                    'message'          => $e->getMessage(),
                    'sql'              => $e->getSql(),
                ]);
            } else {
                Log::error('[DELIVERY TIER] destroy QUERY FAILED', [
                    'tier_id' => $tier->id,
                    'message' => $e->getMessage(),
                    'sql'     => $e->getSql(),
                    'code'    => $e->getCode(),
                ]);
            }
            throw $e;
        } catch (Throwable $e) {
            Log::error('[DELIVERY TIER] destroy UNKNOWN FAILED', [
                'tier_id'   => $tier->id,
                'exception' => get_class($e),
                'message'   => $e->getMessage(),
            ]);
            throw $e;
        }

        Log::info('[DELIVERY TIER] destroy SUCCESS', ['tier_id' => $tier->id]);

        return redirect()->route('admin.delivery-fee-tiers.index')->with('success', 'Tier deleted.');
    }

    protected function validateTier(Request $request, ?int $ignoreId = null): array
    {
        $validated = $request->validate([
            'label'           => 'required|string|max:100',
            'min_distance_km' => 'required|numeric|min:0',
            'max_distance_km' => 'nullable|numeric|gt:min_distance_km',
            'fee'             => 'required|numeric|min:0',
            'estimated_days'  => 'required|integer|min:1|max:90',
            'is_active'       => 'boolean',
            'sort_order'      => 'nullable|integer|min:0',
        ]);

        $validated['is_active']      = $request->boolean('is_active', true);
        $validated['sort_order']     = $validated['sort_order'] ?? 0;
        $validated['estimated_days'] = (int) $validated['estimated_days'];

        $newMin = (float) $validated['min_distance_km'];
        $newMax = isset($validated['max_distance_km']) && $validated['max_distance_km'] !== null
            ? (float) $validated['max_distance_km']
            : null;

        $overlaps = DeliveryFeeTier::query()
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->where(function ($q) use ($newMin, $newMax) {
                $q->where('min_distance_km', '<', $newMax ?? PHP_FLOAT_MAX)
                  ->where(function ($sub) use ($newMin) {
                      $sub->whereNull('max_distance_km')
                          ->orWhere('max_distance_km', '>', $newMin);
                  });
            })
            ->exists();

        if ($overlaps) {
            Log::warning('[DELIVERY TIER] overlap detected', [
                'ignore_id' => $ignoreId,
                'new_range' => [$newMin, $newMax],
            ]);

            throw ValidationException::withMessages([
                'min_distance_km' => 'This range overlaps with an existing tier.',
            ]);
        }

        return $validated;
    }
}
