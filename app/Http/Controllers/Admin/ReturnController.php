<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Customer;
use App\Models\Location;
use App\Models\Product;
use App\Models\ReturnRecord;
use App\Services\ReturnService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReturnController extends Controller
{
    public function __construct(private readonly ReturnService $returns) {}

    public function index(Request $request): Response
    {
        $returns = ReturnRecord::query()
            ->with('customer:id,code,name', 'bill:id,invoice_number')
            ->orderByDesc('return_date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Returns/Index', [
            'returns' => $returns,
        ]);
    }

    public function create(Request $request): Response
    {
        $bill = null;
        if ($billId = $request->integer('bill_id')) {
            $bill = Bill::with('items', 'customer:id,code,name', 'location:id,code,name')
                ->where('status', Bill::STATUS_POSTED)
                ->find($billId);
        }

        return Inertia::render('Admin/Returns/Create', [
            'customers' => Customer::orderBy('name')->get(['id', 'code', 'name']),
            'locations' => Location::where('is_active', true)->get(['id', 'code', 'name', 'is_default']),
            'bill' => $bill ? [
                'id' => $bill->id,
                'invoice_number' => $bill->invoice_number,
                'customer_id' => $bill->customer_id,
                'location_id' => $bill->location_id,
                'items' => $bill->items->map(fn ($i) => [
                    'product_id' => $i->product_id,
                    'product_name' => $i->product_name,
                    'product_sku' => $i->product_sku,
                    'unit_price' => $i->unit_price,
                    'max_qty' => $i->quantity,
                ]),
            ] : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'location_id' => ['required', 'integer', 'exists:locations,id'],
            'bill_id' => ['nullable', 'integer', 'exists:bills,id'],
            'return_date' => ['required', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $return = $this->returns->create($data, $request->user()->id);

        return redirect()
            ->route('admin.returns.show', $return->id)
            ->with('success', "Return {$return->return_number} recorded.");
    }

    public function show(ReturnRecord $return): Response
    {
        $return->load(['customer:id,code,name,phone', 'location:id,code,name', 'bill:id,invoice_number', 'items']);

        return Inertia::render('Admin/Returns/Show', [
            'return' => $return,
        ]);
    }

    public function pdf(ReturnRecord $return): \Illuminate\Http\Response
    {
        $return->load(['customer:id,code,name,phone,address', 'location:id,code,name', 'bill:id,invoice_number', 'items']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.return', [
            'return' => $return,
            'business' => \App\Support\BusinessSettings::forPdf(),
        ])->setPaper('A4');

        return $pdf->stream("{$return->return_number}.pdf");
    }
}
