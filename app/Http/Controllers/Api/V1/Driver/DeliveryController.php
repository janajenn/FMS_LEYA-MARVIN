<?php

namespace App\Http\Controllers\Api\V1\Driver;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeliveryController extends Controller
{
    /* ── List all deliveries assigned to this driver ── */
    public function index(Request $request)
    {
        $this->authorizeDriver($request);

        // ← zone → tier
        $deliveries = Delivery::with(['order.user', 'tier'])
            ->where('driver_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $deliveries->map(fn ($d) => $this->summarize($d)),
        ]);
    }

    /* ── Single delivery detail ── */
    public function show(Request $request, Delivery $delivery)
    {
        $this->authorizeDriver($request);
        $this->authorizeOwnership($request, $delivery);

        // ← zone → tier
        $delivery->load(['order.user', 'order.payments', 'tier']);

        return response()->json([
            'data' => $this->detail($delivery),
        ]);
    }

    /* ── Update status (optionally with proof photo) ── */
    public function updateStatus(Request $request, Delivery $delivery)
    {
        $this->authorizeDriver($request);
        $this->authorizeOwnership($request, $delivery);

        $validated = $request->validate([
            'status'      => 'required|in:picked_up,in_transit,delivered,failed',
            'proof_image' => 'nullable|image|max:4096',
        ]);

        if (
            $validated['status'] === 'delivered'
            && !$request->hasFile('proof_image')
            && !$delivery->proof_image
        ) {
            return response()->json([
                'message' => 'A proof-of-delivery photo is required.',
                'errors'  => ['proof_image' => ['A proof-of-delivery photo is required before marking as Delivered.']],
            ], 422);
        }

        if ($validated['status'] === 'picked_up') {
            $delivery->picked_up_at = now();
            $delivery->status       = 'picked_up';

        } elseif ($validated['status'] === 'delivered') {
            $delivery->delivered_at = now();

            $totalPaid = $delivery->order->payments()
                ->where('status', 'paid')
                ->sum('amount');
            $remaining = max(0, (float) $delivery->order->total - (float) $totalPaid);

            if ($remaining <= 0.01) {
                // ✅ FIX: mark BOTH the order and the delivery as completed,
                // matching the web's DeliveryDriver\DeliveryController.
                $delivery->order->update([
                    'status'         => 'completed',
                    'payment_status' => 'paid',
                ]);
                $delivery->status = 'completed';
            } else {
                $delivery->order->update(['status' => 'delivered']);
                $delivery->status = 'delivered';
            }
        } else {
            $delivery->status = $validated['status'];
        }

        if ($request->hasFile('proof_image')) {
            $path = $request->file('proof_image')->store('delivery_proofs', 'public');
            $delivery->proof_image = $path;
        }

        $delivery->save();
        $delivery->refresh()->load(['order.user', 'order.payments', 'tier']);

        return response()->json([
            'message' => 'Delivery status updated.',
            'data'    => $this->detail($delivery),
        ]);
    }

    /* ── Collect remaining balance (only after delivered) ── */
    public function collectBalance(Request $request, Delivery $delivery)
    {
        $this->authorizeDriver($request);
        $this->authorizeOwnership($request, $delivery);

        $validated = $request->validate([
            'amount'           => 'required|numeric|min:0.01',
            'method'           => 'required|in:cash,gcash,paymongo',
            'reference_number' => 'nullable|string|max:255',
        ]);

        $order = $delivery->order;
        if (!$order) {
            return response()->json(['message' => 'Order not found for this delivery.'], 422);
        }

        if ($delivery->status !== 'delivered') {
            return response()->json([
                'message' => 'Mark the delivery as Delivered first.',
            ], 422);
        }

        $existing = Payment::where('order_id', $order->id)
            ->where('type', 'remaining_balance')
            ->where('status', 'paid')
            ->exists();

        if ($existing) {
            return response()->json([
                'message' => 'Remaining balance already collected.',
            ], 422);
        }

        $totalPaid        = $order->payments()->where('status', 'paid')->sum('amount');
        $remainingBalance = max(0, (float) $order->total - (float) $totalPaid);

        if ($remainingBalance <= 0) {
            return response()->json(['message' => 'Order is already fully paid.'], 422);
        }

        if ((float) $validated['amount'] > $remainingBalance + 0.01) {
            return response()->json([
                'message' => 'Amount exceeds the remaining balance of ₱' . number_format($remainingBalance, 2),
            ], 422);
        }

        DB::transaction(function () use ($order, $delivery, $validated) {
            Payment::create([
                'order_id'         => $order->id,
                'amount'           => $validated['amount'],
                'method'           => $validated['method'],
                'status'           => 'paid',
                'type'             => 'remaining_balance',
                'reference_number' => $validated['reference_number'] ?? null,
                'paid_at'          => now(),
            ]);

            $order->payment_status = 'paid';
            $order->status         = 'completed';
            $order->save();

            // ✅ FIX: mark the delivery itself as completed, matching web
            $delivery->status       = 'completed';
            $delivery->delivered_at = $delivery->delivered_at ?? now();
            $delivery->save();

            Log::info('[DRIVER API] Remaining balance collected', [
                'delivery_id' => $delivery->id,
                'order_id'    => $order->id,
                'amount'      => $validated['amount'],
                'method'      => $validated['method'],
            ]);
        });

        $delivery->refresh()->load(['order.user', 'order.payments', 'tier']);

        return response()->json([
            'message' => 'Remaining balance collected. Order is now fully paid and completed.',
            'data'    => $this->detail($delivery),
        ]);
    }

    /* ─────────────────────────────────────────────────
     * Helpers
     * ───────────────────────────────────────────────── */

    private function authorizeDriver(Request $request): void
    {
        if (optional($request->user()->role)->slug !== 'driver') {
            abort(403, 'This endpoint is for delivery drivers only.');
        }
    }

    private function authorizeOwnership(Request $request, Delivery $delivery): void
    {
        if ((int) $delivery->driver_id !== (int) $request->user()->id) {
            abort(403, 'This delivery is not assigned to you.');
        }
    }

    private function summarize(Delivery $d): array
    {
        return [
            'id'              => $d->id,
            'tracking_number' => $d->tracking_number,
            'status'          => $d->status,
            'proof_image_url' => $d->proof_image
                ? asset('storage/' . $d->proof_image)
                : null,
            'created_at'      => optional($d->created_at)->toIso8601String(),
            'order' => $d->order ? [
                'id'               => $d->order->id,
                'order_number'     => $d->order->order_number,
                'total'            => (float) $d->order->total,
                'payment_status'   => $d->order->payment_status,
                'shipping_address' => $d->order->shipping_address,
                'customer_name'    => $d->order->user?->name,
                'customer_email'   => $d->order->user?->email,
                'delivery_zone'    => $d->order->delivery_zone,   // legacy fallback
            ] : null,
            // ← tier instead of zone
            'tier' => $d->tier ? [
                'id'    => $d->tier->id,
                'label' => $d->tier->label ?? $d->tier->name ?? null,
                'fee'   => (float) ($d->tier->fee ?? 0),
            ] : null,
        ];
    }

    private function detail(Delivery $d): array
    {
        $order = $d->order;

        $totalPaid = $order?->payments
            ->where('status', 'paid')
            ->sum('amount') ?? 0;
        $totalPaid = (float) $totalPaid;
        $remaining = max(0, (float) ($order?->total ?? 0) - $totalPaid);
        $balanceCollected = $order?->payments
            ->where('type', 'remaining_balance')
            ->where('status', 'paid')
            ->isNotEmpty() ?? false;

        return [
            'id'              => $d->id,
            'tracking_number' => $d->tracking_number,
            'status'          => $d->status,
            'picked_up_at'    => optional($d->picked_up_at)->toIso8601String(),
            'delivered_at'    => optional($d->delivered_at)->toIso8601String(),
            'proof_image_url' => $d->proof_image
                ? asset('storage/' . $d->proof_image)
                : null,
            'notes'           => $d->notes,

            'order' => $order ? [
                'id'               => $order->id,
                'order_number'     => $order->order_number,
                'total'            => (float) $order->total,
                'payment_status'   => $order->payment_status,
                'status'           => $order->status,
                'shipping_address' => $order->shipping_address,
                'latitude'         => $order->latitude !== null ? (float) $order->latitude : null,
                'longitude'        => $order->longitude !== null ? (float) $order->longitude : null,
                'notes'            => $order->notes,
                'customer_name'    => $order->user?->name,
                'customer_email'   => $order->user?->email,
                'total_paid'       => round($totalPaid, 2),
                'remaining_balance'=> round($remaining, 2),
                'balance_collected'=> $balanceCollected,
                'delivery_zone'    => $order->delivery_zone,   // legacy fallback
            ] : null,

            // ← tier instead of zone
            'tier' => $d->tier ? [
                'id'    => $d->tier->id,
                'label' => $d->tier->label ?? $d->tier->name ?? null,
                'fee'   => (float) ($d->tier->fee ?? 0),
            ] : null,

            // ← new: distance info from the km-based system
            'distance_km'    => $this->computeDistanceKm($d),
            'estimated_days' => $this->estimateDays($d),

            'store_location' => [
                'name'      => config('store.name'),
                'address'   => config('store.address'),
                'latitude'  => (float) config('store.latitude'),
                'longitude' => (float) config('store.longitude'),
            ],
        ];
    }

    /**
     * Compute the distance from the store to the customer. Prefers a stored
     * delivery.distance_km column if present, otherwise falls back to a
     * haversine calc using the order's pinned coordinates.
     */
    private function computeDistanceKm(Delivery $d): ?float
    {
        $order = $d->order;
        if (!$order) return null;

        // Stored value from the delivery-creation step, if available
        $stored = $d->getAttribute('distance_km');
        if ($stored !== null && $stored !== '') {
            return round((float) $stored, 2);
        }

        $storeLat = (float) config('store.latitude');
        $storeLng = (float) config('store.longitude');
        $orderLat = $order->latitude;
        $orderLng = $order->longitude;

        if ($orderLat === null || $orderLng === null || !$storeLat || !$storeLng) {
            return null;
        }

        $earthRadius = 6371;
        $dLat = deg2rad((float) $orderLat - $storeLat);
        $dLng = deg2rad((float) $orderLng - $storeLng);
        $a = sin($dLat / 2) ** 2
           + cos(deg2rad($storeLat)) * cos(deg2rad((float) $orderLat)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 2);
    }

    private function estimateDays(Delivery $d): ?int
    {
        // Prefer a value on the delivery record, then the tier, then config
        $stored = $d->getAttribute('estimated_days');
        if ($stored !== null && $stored !== '') {
            return (int) $stored;
        }
        if ($d->tier && isset($d->tier->estimated_days)) {
            return (int) $d->tier->estimated_days;
        }
        $config = config('store.estimated_days');
        return $config !== null ? (int) $config : null;
    }
}
