<?php

namespace App\Http\Controllers\Rep;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RepCommissionController extends Controller
{
    public function index(Request $request): Response
    {
        $rep = $request->user();

        $from = $request->string('from')->value() ?: now()->startOfMonth()->toDateString();
        $to = $request->string('to')->value() ?: now()->toDateString();

        $bills = Bill::query()
            ->where('sales_rep_id', $rep->id)
            ->where('status', 'posted')
            ->whereBetween('bill_date', [$from, $to])
            ->with('customer:id,code,name')
            ->orderByDesc('bill_date')->orderByDesc('id')
            ->get(['id', 'invoice_number', 'customer_id', 'bill_date', 'subtotal', 'discount_amount', 'grand_total', 'paid_amount', 'commission_rate', 'commission_amount']);

        $totals = [
            'count' => $bills->count(),
            'gross_sales' => round((float) $bills->sum('grand_total'), 2),
            'commission_base' => round((float) $bills->sum(fn ($b) => (float) $b->subtotal - (float) $b->discount_amount), 2),
            'commission_total' => round((float) $bills->sum('commission_amount'), 2),
        ];

        return Inertia::render('Rep/Commissions', [
            'rep' => [
                'name' => $rep->name,
                'commission_rate' => (float) $rep->commission_rate,
            ],
            'filters' => ['from' => $from, 'to' => $to],
            'bills' => $bills,
            'totals' => $totals,
        ]);
    }
}
