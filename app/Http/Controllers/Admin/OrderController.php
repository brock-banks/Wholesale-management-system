<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Location;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request): Response
    {
        $orders = Order::query()
            ->where('status', '!=', Order::STATUS_DRAFT)
            ->with('customer:id,code,name', 'location:id,code,name')
            ->when($request->string('status')->value(), fn ($q, $s) => $q->where('status', $s))
            ->when($request->integer('customer_id'), fn ($q, $id) => $q->where('customer_id', $id))
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'customers' => Customer::orderBy('name')->get(['id', 'code', 'name']),
            'filters' => [
                'status' => $request->string('status')->value() ?: null,
                'customer_id' => $request->integer('customer_id') ?: null,
            ],
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        $order->load(['customer:id,code,name,phone,address,current_balance,credit_limit', 'items', 'location:id,code,name', 'bill:id,invoice_number']);

        if ($order->status === Order::STATUS_PENDING) {
            $this->orders->review($order);
            $order->refresh()->load(['customer', 'items']);
        }

        return Inertia::render('Admin/Orders/Show', [
            'order' => $order,
            'locations' => Location::where('is_active', true)->get(['id', 'code', 'name', 'is_default']),
        ]);
    }

    public function confirm(Request $request, Order $order): RedirectResponse
    {
        $data = $request->validate([
            'location_id' => ['required', 'integer', 'exists:locations,id'],
            'admin_notes' => ['nullable', 'string', 'max:500'],
            'confirmed' => ['required', 'array'],
            'confirmed.*' => ['required', 'integer', 'min:0'],
        ]);

        $this->orders->modifyAndConfirm(
            order: $order,
            confirmedQuantities: $data['confirmed'],
            adminNotes: $data['admin_notes'] ?? null,
            locationId: $data['location_id'],
            userId: $request->user()->id,
        );

        return redirect()->route('admin.orders.show', $order->id)->with('success', "Order {$order->order_number} confirmed.");
    }

    public function hold(Request $request, Order $order): RedirectResponse
    {
        $data = $request->validate(['admin_notes' => ['nullable', 'string', 'max:500']]);
        $this->orders->holdOrder($order, $data['admin_notes'] ?? null, $request->user()->id);

        return back()->with('success', 'Order placed on hold.');
    }

    public function cancel(Request $request, Order $order): RedirectResponse
    {
        $data = $request->validate(['admin_notes' => ['nullable', 'string', 'max:500']]);
        $this->orders->cancelOrder($order, $data['admin_notes'] ?? null, $request->user()->id);

        return back()->with('success', 'Order cancelled.');
    }
}
