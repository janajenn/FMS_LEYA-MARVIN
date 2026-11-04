<?php

namespace App\Services;

use App\Models\DeliveryFeeTier;

class DeliveryFeeCalculator
{
    public function storeLat(): float { return (float) config('store.latitude'); }
    public function storeLng(): float { return (float) config('store.longitude'); }

    /**
     * Fallback used only if a matched tier somehow has no estimate.
     * In normal operation every tier carries its own estimated_days.
     */
    protected function fallbackEstimatedDays(): int
    {
        return max(1, (int) config('store.estimated_days', 3));
    }

    public function distanceFromStoreKm(float $lat, float $lng): float
    {
        return $this->haversine($this->storeLat(), $this->storeLng(), $lat, $lng);
    }

    /**
     * @return array{
     *   distance_km: float,
     *   fee: ?float,
     *   tier: ?array,
     *   deliverable: bool,
     *   estimated_days: int
     * }
     */
    public function resolve(float $lat, float $lng): array
    {
        $km = round($this->distanceFromStoreKm($lat, $lng), 2);

        $tier = DeliveryFeeTier::query()
            ->where('is_active', true)
            ->where('min_distance_km', '<=', $km)
            ->where(function ($q) use ($km) {
                $q->whereNull('max_distance_km')->orWhere('max_distance_km', '>', $km);
            })
            ->orderBy('min_distance_km')
            ->first();

        $estimatedDays = $tier
            ? max(1, (int) ($tier->estimated_days ?? 1))
            : $this->fallbackEstimatedDays();

        return [
            'distance_km' => $km,
            'fee'         => $tier ? (float) $tier->fee : null,
            'tier'        => $tier ? [
                'id'              => $tier->id,
                'label'           => $tier->label,
                'fee'             => (float) $tier->fee,
                'min_distance_km' => (float) $tier->min_distance_km,
                'max_distance_km' => $tier->max_distance_km !== null ? (float) $tier->max_distance_km : null,
                'estimated_days'  => $estimatedDays,
            ] : null,
            'deliverable'    => $tier !== null,
            'estimated_days' => $estimatedDays,
        ];
    }

    public function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
           + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
