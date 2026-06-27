<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortalOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $customer = $this->customer($request);

        $orders = Order::where('customer_id', $customer->id)
            ->where('status', '!=', Order::STATUS_DRAFT)
            ->orderByDesc('id')
            ->paginate(20);

        return Inertia::render('Portal/Orders/Index', [
            'orders' => $orders,
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        $customer = $this->customer($request);
        abort_unless($order->customer_id === $customer->id, 403);
        $order->load(['items', 'bill:id,invoice_number']);

        return Inertia::render('Portal/Orders/Show', [
            'order' => $order,
        ]);
    }

    private function customer(Request $request): Customer
    {
        $customer = $request->user()?->customer;
        abort_if(! $customer, 403, 'No customer record linked to this account.');
        return $customer;
    }
}
