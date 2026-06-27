<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Payment;
use App\Services\BillService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(private readonly BillService $bills) {}

    public function index(Request $request): Response
    {
        $payments = Payment::query()
            ->with('customer:id,code,name')
            ->when($request->string('search')->trim()->value(), function ($q, $term) {
                $q->where(function ($w) use ($term) {
                    $w->where('payment_number', 'like', "%{$term}%")
                        ->orWhereHas('customer', function ($c) use ($term) {
                            $c->where('name', 'like', "%{$term}%");
                        });
                });
            })
            ->when($request->string('method')->value(), fn ($q, $m) => $q->where('method', $m))
            ->orderByDesc('payment_date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Payments/Index', [
            'payments' => $payments,
            'filters' => [
                'search' => $request->string('search')->value(),
                'method' => $request->string('method')->value() ?: null,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $customerId = $request->integer('customer_id');

        return Inertia::render('Admin/Payments/Create', [
            'customers' => Customer::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'current_balance']),
            'selected_customer_id' => $customerId ?: null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'in:cash,card,check,bank,debit'],
            'reference' => ['nullable', 'string', 'max:128'],
            'bank_name' => ['nullable', 'string', 'max:120'],
            'check_number' => ['nullable', 'string', 'max:64'],
            'check_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payment = $this->bills->recordStandalonePayment($data, $request->user()->id);

        return redirect()
            ->route('admin.payments.show', $payment->id)
            ->with('success', "Payment {$payment->payment_number} recorded.");
    }

    public function show(Payment $payment): Response
    {
        $payment->load(['customer:id,code,name', 'allocations.bill:id,invoice_number,grand_total']);

        return Inertia::render('Admin/Payments/Show', [
            'payment' => $payment,
        ]);
    }

    public function pdf(Payment $payment): \Illuminate\Http\Response
    {
        $payment->load(['customer:id,code,name,phone,address', 'allocations.bill:id,invoice_number,grand_total']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.receipt', [
            'payment' => $payment,
            'business' => \App\Support\BusinessSettings::forPdf(),
        ])->setPaper('A4');

        return $pdf->stream("{$payment->payment_number}.pdf");
    }

    public function cancel(Request $request, Payment $payment): RedirectResponse
    {
        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $payment->load('allocations');
        $this->bills->cancelPayment($payment, $data['reason'] ?? null, $request->user()->id);

        return back()->with('success', "Payment {$payment->payment_number} cancelled.");
    }
}
