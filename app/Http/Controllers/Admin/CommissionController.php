<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommissionController extends Controller
{
    public function index(Request $request): Response
    {
        $from = $request->string('from')->value() ?: now()->startOfMonth()->toDateString();
        $to = $request->string('to')->value() ?: now()->toDateString();

        $reps = User::role('sales_rep')->get(['id', 'name', 'email', 'commission_rate']);

        $byRep = Bill::query()
            ->whereNotNull('sales_rep_id')
            ->where('status', 'posted')
            ->whereBetween('bill_date', [$from, $to])
            ->groupBy('sales_rep_id')
            ->selectRaw('sales_rep_id, count(*) as bills_count, sum(grand_total) as gross_sales, sum(commission_amount) as commission_total')
            ->get()
            ->keyBy('sales_rep_id');

        $rows = $reps->map(function (User $rep) use ($byRep) {
            $agg = $byRep->get($rep->id);
            return [
                'id' => $rep->id,
                'name' => $rep->name,
                'email' => $rep->email,
                'commission_rate' => (float) $rep->commission_rate,
                'bills_count' => (int) ($agg->bills_count ?? 0),
                'gross_sales' => round((float) ($agg->gross_sales ?? 0), 2),
                'commission_total' => round((float) ($agg->commission_total ?? 0), 2),
            ];
        });

        return Inertia::render('Admin/Reports/Commissions', [
            'filters' => ['from' => $from, 'to' => $to],
            'reps' => $rows,
            'totals' => [
                'gross_sales' => round((float) $rows->sum('gross_sales'), 2),
                'commission_total' => round((float) $rows->sum('commission_total'), 2),
            ],
        ]);
    }
}
