<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Services\PurchaseService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function __construct(private readonly PurchaseService $purchases) {}

    public function index(Request $request): Response
    {
        $pos = PurchaseOrder::query()
            ->with('supplier:id,code,name', 'location:id,code,name')
            ->when($request->string('status')->value(), fn ($q, $s) => $q->where('status', $s))
            ->when($request->integer('supplier_id'), fn ($q, $id) => $q->where('supplier_id', $id))
            ->orderByDesc('po_date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Purchases/Index', [
            'pos' => $pos,
            'suppliers' => Supplier::orderBy('name')->get(['id', 'code', 'name']),
            'filters' => [
                'status' => $request->string('status')->value() ?: null,
                'supplier_id' => $request->integer('supplier_id') ?: null,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Purchases/Create', [
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'code', 'name', 'current_balance']),
            'locations' => Location::where('is_active', true)->orderBy('name')->get(['id', 'code', 'name', 'is_default']),
            'products' => Product::where('is_active', true)->orderBy('name')->limit(500)->get(['id', 'sku', 'name', 'unit', 'cost_price']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'location_id' => ['required', 'integer', 'exists:locations,id'],
            'po_date' => ['required', 'date'],
            'expected_date' => ['nullable', 'date'],
            'freight' => ['nullable', 'numeric', 'min:0'],
            'other_charges' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.ordered_qty' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ]);

        $po = $this->purchases->createPO($data, $request->user()->id);

        return redirect()->route('admin.purchases.show', $po->id)->with('success', "PO {$po->po_number} created.");
    }

    public function show(PurchaseOrder $purchase): Response
    {
        $purchase->load(['supplier', 'location', 'items', 'receipts.items', 'allocations.payment']);
        return Inertia::render('Admin/Purchases/Show', [
            'po' => $purchase,
        ]);
    }

    public function receive(Request $request, PurchaseOrder $purchase): RedirectResponse
    {
        $data = $request->validate([
            'receipt_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.po_item_id' => ['required', 'integer'],
            'items.*.received_qty' => ['required', 'integer', 'min:0'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ]);

        $rows = $data['items'];
        $rows['_receipt_date'] = $data['receipt_date'];

        $grn = $this->purchases->receive($purchase, $rows, $data['notes'] ?? null, $request->user()->id);

        return redirect()->route('admin.purchases.show', $purchase->id)->with('success', "Goods receipt {$grn->grn_number} recorded.");
    }

    public function pdf(PurchaseOrder $purchase): HttpResponse
    {
        $purchase->load(['supplier', 'location', 'items']);
        $pdf = Pdf::loadView('pdf.purchase_order', [
            'po' => $purchase,
            'business' => \App\Support\BusinessSettings::forPdf(),
        ])->setPaper('A4');
        return $pdf->stream("{$purchase->po_number}.pdf");
    }
}
