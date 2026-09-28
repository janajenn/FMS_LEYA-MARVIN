<?php

namespace App\Http\Controllers\DeliveryDriver;

use App\Http\Controllers\Controller;
use App\Events\Payment\RemainingBalanceCollected;
use App\Models\Delivery;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;


class DeliveryController extends Controller
{
    public function index()
    {
        $deliveries = Delivery::with(['order.user', 'order.payments', 'zone'])
            ->where('driver_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('DeliveryDriver/Deliveries/Index', ['deliveries' => $deliveries]);
    }

   public function show(Delivery $delivery)
{
    if ($delivery->driver_id !== Auth::id()) {
        abort(403);
    }

    $delivery->load(['order.user', 'order.payments', 'zone']);

    return Inertia::render('DeliveryDriver/Deliveries/Show', [
        'delivery' => $delivery,
        'storeLocation' => [
            'name'      => config('store.name'),
            'address'   => config('store.address'),
            'latitude'  => (float) config('store.latitude'),
            'longitude' => (float) config('store.longitude'),
        ],
    ]);
}

  public function updateStatus(Request $request, Delivery $delivery)
{
    if ($delivery->driver_id !== Auth::id()) {
        abort(403);
    }

    $validated = $request->validate([
        'status' => 'required|in:picked_up,in_transit,delivered,failed',
        'proof_image' => 'nullable|image|max:4096',
    ]);

    // ✅ Require proof of delivery when marking as Delivered
    if (
        $validated['status'] === 'delivered'
        && !$request->hasFile('proof_image')
        && !$delivery->proof_image
    ) {
        return back()->withErrors([
            'proof_image' => 'A proof-of-delivery photo is required before marking as Delivered.',
        ]);
    }

    if ($validated['status'] === 'picked_up') {
        $delivery->picked_up_at = now();
    } elseif ($validated['status'] === 'delivered') {
        $delivery->delivered_at = now();
        // Order status: delivered (payment still pending if balance not collected)
        $delivery->order->update(['status' => 'delivered']);
    }

    $delivery->status = $validated['status'];

    if ($request->hasFile('proof_image')) {
        $path = $request->file('proof_image')->store('delivery_proofs', 'public');
        $delivery->proof_image = $path;
    }

    $delivery->save();

    return redirect()->route('driver.deliveries.show', $delivery->id)
        ->with('success', 'Delivery status updated.');
}


   public function collectBalance(Request $request, Delivery $delivery)
{
    if ($delivery->driver_id !== Auth::id()) {
        abort(403);
    }

    $validated = $request->validate([
        'amount'           => 'required|numeric|min:0.01',
        'method'           => 'required|in:cash,gcash,paymongo',
        'reference_number' => 'nullable|string|max:255',
    ]);

    $order = $delivery->order;

    if (!$order) {
        return back()->withErrors(['error' => 'Order not found for this delivery.']);
    }

    // ✅ Must be marked Delivered before collecting balance
    if ($delivery->status !== 'delivered') {
        return back()->withErrors([
            'error' => 'The delivery must be marked as Delivered before collecting the remaining balance.',
        ]);
    }

    // Prevent double-collection
    $existing = Payment::where('order_id', $order->id)
        ->where('type', 'remaining_balance')
        ->where('status', 'paid')
        ->exists();

    if ($existing) {
        return back()->withErrors(['error' => 'Remaining balance has already been collected.']);
    }

    // Compute remaining balance
    $totalPaid = $order->payments()->where('status', 'paid')->sum('amount');
    $remainingBalance = max(0, (float) $order->total - (float) $totalPaid);

    if ($remainingBalance <= 0) {
        return back()->withErrors(['error' => 'This order is already fully paid.']);
    }

    if ((float) $validated['amount'] > $remainingBalance + 0.01) {
        return back()->withErrors([
            'amount' => 'Amount exceeds the remaining balance of ₱' . number_format($remainingBalance, 2),
        ]);
    }

    $payment = null;

    DB::transaction(function () use ($order, $delivery, $validated, &$payment) {
        // ✅ Create payment record (no proof_image — already captured on delivery)
        $payment = Payment::create([
            'order_id'         => $order->id,
            'amount'           => $validated['amount'],
            'method'           => $validated['method'],
            'status'           => 'paid',
            'type'             => 'remaining_balance',
            'reference_number' => $validated['reference_number'] ?? null,
            'paid_at'          => now(),
        ]);

        // ✅ Order: fully paid AND completed
        $order->payment_status = 'paid';
        $order->status = 'completed';
        $order->save();

        // ✅ Delivery: completed
        $delivery->status = 'completed';
        $delivery->delivered_at = $delivery->delivered_at ?? now();
        $delivery->save();

        Log::info('[REMAINING BALANCE] Collected', [
            'order_id'   => $order->id,
            'payment_id' => $payment->id,
            'amount'     => $validated['amount'],
            'method'     => $validated['method'],
            'driver_id'  => Auth::id(),
        ]);
    });

    if ($payment) {
        RemainingBalanceCollected::dispatch($payment);
    }

    return redirect()->route('driver.deliveries.index')
        ->with('success', 'Remaining balance collected. Order is now fully paid and completed.');
}



}
