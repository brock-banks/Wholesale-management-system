<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Services\SupplierPaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierPaymentController extends Controller
{
    public function __construct(private readonly SupplierPaymentService $payments) {}

    public function index(Request $request): Response
    {
        $payments = SupplierPayment::query()
            ->with('supplier:id,code,name')
            ->when($request->string('method')->value(), fn ($q, $m) => $q->where('method', $m))
            ->orderByDesc('payment_date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/SupplierPayments/Index', [
            'payments' => $payments,
            'filters' => ['method' => $request->string('method')->value() ?: null],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Admin/SupplierPayments/Create', [
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'code', 'name', 'current_balance']),
            'selected_supplier_id' => $request->integer('supplier_id') ?: null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'in:cash,card,check,bank'],
            'reference' => ['nullable', 'string', 'max:128'],
            'bank_name' => ['nullable', 'string', 'max:120'],
            'check_number' => ['nullable', 'string', 'max:64'],
            'check_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payment = $this->payments->record($data, $request->user()->id);

        return redirect()->route('admin.supplier_payments.show', $payment->id)->with('success', "Payment {$payment->payment_number} recorded.");
    }

    public function show(SupplierPayment $supplierPayment): Response
    {
        $supplierPayment->load(['supplier:id,code,name', 'allocations.purchaseOrder:id,po_number,total']);
        return Inertia::render('Admin/SupplierPayments/Show', ['payment' => $supplierPayment]);
    }
}
