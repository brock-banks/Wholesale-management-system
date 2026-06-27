<?php

namespace App\Http\Controllers\Rep;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RepHomeController extends Controller
{
    public function index(Request $request): Response
    {
        $rep = $request->user();
        $today = now()->toDateString();
        $monthStart = now()->startOfMonth()->toDateString();

        return Inertia::render('Rep/Home', [
            'rep' => [
                'id' => $rep->id,
                'name' => $rep->name,
                'commission_rate' => (float) $rep->commission_rate,
            ],
            'stats' => [
                'my_customers' => (int) Customer::where('sales_rep_id', $rep->id)->count(),
                'orders_open' => (int) Order::where('sales_rep_id', $rep->id)
                    ->whereIn('status', ['pending', 'reviewing', 'confirmed', 'on_hold'])
                    ->count(),
                'sales_today' => round((float) Bill::where('sales_rep_id', $rep->id)
                    ->where('status', 'posted')
                    ->whereDate('bill_date', $today)
                    ->sum('grand_total'), 2),
                'sales_month' => round((float) Bill::where('sales_rep_id', $rep->id)
                    ->where('status', 'posted')
                    ->whereBetween('bill_date', [$monthStart, $today])
                    ->sum('grand_total'), 2),
                'commission_month' => round((float) Bill::where('sales_rep_id', $rep->id)
                    ->where('status', 'posted')
                    ->whereBetween('bill_date', [$monthStart, $today])
                    ->sum('commission_amount'), 2),
            ],
            'recent_orders' => Order::where('sales_rep_id', $rep->id)
                ->with('customer:id,code,name')
                ->orderByDesc('id')
                ->limit(8)
                ->get(['id', 'order_number', 'customer_id', 'order_date', 'status']),
        ]);
    }
}
