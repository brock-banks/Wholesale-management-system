<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request): Response
    {
        $customer = $this->customer($request);
        $cart = $customer->cart();

        return Inertia::render('Portal/Cart', [
            'cart' => $cart ? [
                'id' => $cart->id,
                'order_number' => $cart->order_number,
                'customer_notes' => $cart->customer_notes,
                'items' => $cart->items->map(fn (OrderItem $i) => [
                    'id' => $i->id,
                    'product_id' => $i->product_id,
                    'product_name' => $i->product_name,
                    'product_sku' => $i->product_sku,
                    'unit_price' => $i->unit_price,
                    'requested_qty' => $i->requested_qty,
                ]),
            ] : null,
        ]);
    }

    public function add(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $customer = $this->customer($request);
        $product = Product::findOrFail($data['product_id']);
        $this->orders->addToCart($customer, $product, (int) ($data['quantity'] ?? 1));

        return back()->with('success', "Added {$product->name} to cart.");
    }

    public function update(Request $request, OrderItem $item): RedirectResponse
    {
        $this->authorizeItem($request, $item);
        $data = $request->validate(['quantity' => ['required', 'integer', 'min:0']]);
        $this->orders->updateCartLine($item, (int) $data['quantity']);

        return back();
    }

    public function remove(Request $request, OrderItem $item): RedirectResponse
    {
        $this->authorizeItem($request, $item);
        $this->orders->removeCartLine($item);

        return back();
    }

    public function submit(Request $request): RedirectResponse
    {
        $data = $request->validate(['customer_notes' => ['nullable', 'string', 'max:500']]);
        $customer = $this->customer($request);
        $order = $this->orders->submitCart($customer, $data['customer_notes'] ?? null);

        return redirect()
            ->route('portal.orders.show', $order->id)
            ->with('success', "Order {$order->order_number} submitted. Admin will review it shortly.");
    }

    private function customer(Request $request): Customer
    {
        $customer = $request->user()?->customer;
        abort_if(! $customer, 403, 'No customer record linked to this account.');
        return $customer;
    }

    private function authorizeItem(Request $request, OrderItem $item): void
    {
        $customer = $this->customer($request);
        abort_unless($item->order->customer_id === $customer->id && $item->order->status === \App\Models\Order::STATUS_DRAFT, 403);
    }
}
