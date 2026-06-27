<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Customer;
use App\Models\Location;
use App\Models\Order;
use App\Models\Product;
use App\Services\BillService;
use App\Services\OrderService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BillController extends Controller
{
    public function __construct(
        private readonly BillService $bills,
        private readonly OrderService $orders,
    ) {}

    public function index(Request $request): Response
    {
        $bills = Bill::query()
            ->with('customer:id,code,name', 'location:id,code,name')
            ->when($request->string('search')->trim()->value(), function ($q, $term) {
                $q->where(function ($w) use ($term) {
                    $w->where('invoice_number', 'like', "%{$term}%")
                        ->orWhereHas('customer', function ($c) use ($term) {
                            $c->where('name', 'like', "%{$term}%")
                                ->orWhere('code', 'like', "%{$term}%");
                        });
                });
            })
            ->when($request->string('status')->value(), fn ($q, $s) => $q->where('status', $s))
            ->when($request->integer('customer_id'), fn ($q, $id) => $q->where('customer_id', $id))
            ->orderByDesc('bill_date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Bills/Index', [
            'bills' => $bills,
            'customers' => Customer::orderBy('name')->get(['id', 'code', 'name']),
            'filters' => [
                'search' => $request->string('search')->value(),
                'status' => $request->string('status')->value() ?: null,
                'customer_id' => $request->integer('customer_id') ?: null,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $fromOrder = null;
        if ($orderId = $request->integer('from_order')) {
            $fromOrder = Order::with('items')->find($orderId);
            if ($fromOrder && $fromOrder->status !== Order::STATUS_CONFIRMED) {
                $fromOrder = null;
            }
        }

        $fromBill = null;
        if ($billId = $request->integer('from_bill')) {
            $fromBill = Bill::with('items')->find($billId);
        }

        $locationId = $request->integer('location_id')
            ?: $fromOrder?->location_id
            ?: $fromBill?->location_id
            ?: Location::where('is_default', true)->value('id');
        $location = Location::find($locationId) ?? Location::orderBy('name')->first();

        $products = Product::query()
            ->with(['stocks' => function ($q) use ($location) {
                if ($location) $q->where('location_id', $location->id);
            }])
            ->where('is_active', true)
            ->orderBy('name')
            ->limit(500)
            ->get(['id', 'sku', 'name', 'unit', 'pack_size', 'wholesale_price', 'tax_rate'])
            ->map(function (Product $p) use ($location) {
                $p->setAttribute('available', $location ? (int) $p->stocks->where('location_id', $location->id)->sum('quantity') : 0);
                unset($p->stocks);
                return $p;
            });

        $initialItems = [];
        if ($fromOrder) {
            foreach ($fromOrder->items as $i) {
                $qty = (int) ($i->confirmed_qty ?? $i->requested_qty);
                if ($qty <= 0) continue;
                $product = $products->firstWhere('id', $i->product_id);
                $initialItems[] = [
                    'product_id' => $i->product_id,
                    'product_name' => $i->product_name,
                    'product_sku' => $i->product_sku,
                    'unit' => $product?->unit ?? 'pcs',
                    'available' => $product?->available ?? 0,
                    'unit_price' => (float) $i->unit_price,
                    'quantity' => $qty,
                    'discount_amount' => 0,
                    'tax_rate' => 0,
                ];
            }
        } elseif ($fromBill) {
            foreach ($fromBill->items as $i) {
                $product = $products->firstWhere('id', $i->product_id);
                $initialItems[] = [
                    'product_id' => $i->product_id,
                    'product_name' => $i->product_name,
                    'product_sku' => $i->product_sku,
                    'unit' => $product?->unit ?? 'pcs',
                    'available' => $product?->available ?? 0,
                    'unit_price' => (float) $i->unit_price,
                    'quantity' => (int) $i->quantity,
                    'discount_amount' => (float) $i->discount_amount,
                    'tax_rate' => (float) $i->tax_rate,
                ];
            }
        }

        return Inertia::render('Admin/Bills/Create', [
            'customers' => Customer::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'phone', 'current_balance', 'credit_limit']),
            'locations' => Location::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'is_default']),
            'products' => $products,
            'selected_location_id' => $location?->id,
            'from_order' => $fromOrder ? [
                'id' => $fromOrder->id,
                'order_number' => $fromOrder->order_number,
                'customer_id' => $fromOrder->customer_id,
                'items' => $initialItems,
                'notes' => $fromOrder->customer_notes,
            ] : null,
            'from_bill' => $fromBill ? [
                'id' => $fromBill->id,
                'invoice_number' => $fromBill->invoice_number,
                'customer_id' => $fromBill->customer_id,
                'items' => $initialItems,
                'notes' => $fromBill->notes,
            ] : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'location_id' => ['required', 'integer', 'exists:locations,id'],
            'bill_date' => ['required', 'date'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
            'from_order_id' => ['nullable', 'integer', 'exists:orders,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payments' => ['array'],
            'payments.*.amount' => ['required', 'numeric', 'min:0.01'],
            'payments.*.method' => ['required', 'in:cash,card,check,bank,debit'],
            'payments.*.payment_date' => ['nullable', 'date'],
            'payments.*.reference' => ['nullable', 'string', 'max:128'],
            'payments.*.bank_name' => ['nullable', 'string', 'max:120'],
            'payments.*.check_number' => ['nullable', 'string', 'max:64'],
            'payments.*.check_date' => ['nullable', 'date'],
            'payments.*.due_date' => ['nullable', 'date'],
            'payments.*.notes' => ['nullable', 'string', 'max:255'],
        ]);

        if (! empty($data['from_order_id'])) {
            $order = Order::find($data['from_order_id']);
            if ($order?->sales_rep_id) {
                $data['sales_rep_id'] = $order->sales_rep_id;
            }
        }

        $bill = $this->bills->create($data, $request->user()->id);

        if (! empty($data['from_order_id'])) {
            $order = Order::find($data['from_order_id']);
            if ($order && $order->status === Order::STATUS_CONFIRMED) {
                $this->orders->markInvoiced($order, $bill->id);
            }
        }

        return redirect()
            ->route('admin.bills.show', $bill->id)
            ->with('success', "Invoice {$bill->invoice_number} posted.");
    }

    public function show(Bill $bill): Response
    {
        $bill->load([
            'customer:id,code,name,phone,address,current_balance,credit_limit',
            'location:id,code,name',
            'items',
            'allocations.payment',
        ]);

        return Inertia::render('Admin/Bills/Show', [
            'bill' => $bill,
        ]);
    }

    public function destroy(Request $request, Bill $bill): RedirectResponse
    {
        $this->bills->cancel($bill, $request->user()->id);

        return redirect()->route('admin.bills.index')->with('success', "Invoice {$bill->invoice_number} cancelled.");
    }

    public function pdf(Bill $bill): HttpResponse
    {
        $bill->load(['customer', 'location', 'items']);

        $pdf = Pdf::loadView('pdf.invoice', [
            'bill' => $bill,
            'business' => \App\Support\BusinessSettings::forPdf(),
        ])->setPaper('A4');

        return $pdf->stream("{$bill->invoice_number}.pdf");
    }
}
