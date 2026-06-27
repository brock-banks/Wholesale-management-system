<?php

namespace App\Http\Controllers\Rep;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RepCustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $rep = $request->user();

        $customers = Customer::query()
            ->where('sales_rep_id', $rep->id)
            ->where('is_active', true)
            ->when($request->string('search')->trim()->value(), function ($q, $term) {
                $q->where(function ($w) use ($term) {
                    $w->where('name', 'like', "%{$term}%")
                        ->orWhere('code', 'like', "%{$term}%")
                        ->orWhere('phone', 'like', "%{$term}%");
                });
            })
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'phone', 'address', 'current_balance', 'credit_limit']);

        return Inertia::render('Rep/Customers/Index', [
            'customers' => $customers,
            'filters' => ['search' => $request->string('search')->value()],
        ]);
    }

    public function show(Request $request, Customer $customer): Response
    {
        abort_unless($customer->sales_rep_id === $request->user()->id, 403);

        $bills = $customer->bills()
            ->orderByDesc('bill_date')->orderByDesc('id')
            ->limit(10)
            ->get(['id', 'invoice_number', 'bill_date', 'grand_total', 'paid_amount', 'status']);

        $orders = $customer->orders()
            ->where('sales_rep_id', $request->user()->id)
            ->orderByDesc('id')
            ->limit(10)
            ->get(['id', 'order_number', 'order_date', 'status']);

        return Inertia::render('Rep/Customers/Show', [
            'customer' => $customer->only(['id', 'code', 'name', 'phone', 'address', 'current_balance', 'credit_limit', 'notes']),
            'bills' => $bills,
            'orders' => $orders,
        ]);
    }
}
