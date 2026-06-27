<?php

namespace App\Http\Controllers\Rep;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RepOrderController extends Controller
{
    public function __construct(private readonly NotificationService $notify) {}

    public function index(Request $request): Response
    {
        $rep = $request->user();

        $orders = Order::query()
            ->where('sales_rep_id', $rep->id)
            ->with('customer:id,code,name')
            ->when($request->string('status')->value(), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Rep/Orders/Index', [
            'orders' => $orders,
            'filters' => ['status' => $request->string('status')->value() ?: null],
        ]);
    }

    public function create(Request $request): Response
    {
        $rep = $request->user();

        $customerId = $request->integer('customer_id');
        $customers = Customer::where('sales_rep_id', $rep->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'phone', 'current_balance', 'credit_limit']);

        $products = Product::where('is_active', true)
            ->orderBy('name')
            ->limit(500)
            ->get(['id', 'sku', 'name', 'unit', 'pack_size', 'wholesale_price']);

        return Inertia::render('Rep/Orders/Create', [
            'customers' => $customers,
            'products' => $products,
            'selected_customer_id' => $customerId ?: null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $rep = $request->user();
        $customer = Customer::findOrFail($data['customer_id']);
        abort_unless($customer->sales_rep_id === $rep->id, 403);

        $order = DB::transaction(function () use ($data, $customer, $rep) {
            $order = Order::create([
                'order_number' => Order::nextOrderNumber(),
                'customer_id' => $customer->id,
                'sales_rep_id' => $rep->id,
                'order_date' => now()->toDateString(),
                'submitted_at' => now(),
                'status' => Order::STATUS_PENDING,
                'customer_notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $i => $line) {
                $product = Product::find($line['product_id']);
                if (! $product) continue;
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'unit_price' => $line['unit_price'],
                    'requested_qty' => $line['quantity'],
                    'sort_order' => $i,
                ]);
            }

            return $order->fresh(['items']);
        });

        $this->notify->notifyAdmins(
            type: 'order.pending',
            title: "New order from {$customer->name} (via {$rep->name})",
            message: "{$order->order_number} · {$order->items->count()} items",
            link: "/admin/orders/{$order->id}",
        );

        return redirect()
            ->route('rep.orders.show', $order->id)
            ->with('success', "Order {$order->order_number} submitted.");
    }

    public function show(Request $request, Order $order): Response
    {
        abort_unless($order->sales_rep_id === $request->user()->id, 403);

        $order->load(['customer:id,code,name,phone', 'items', 'bill:id,invoice_number']);

        return Inertia::render('Rep/Orders/Show', [
            'order' => $order,
        ]);
    }
}
