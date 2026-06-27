<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PortalHomeController extends Controller
{
    public function index(Request $request): Response
    {
        $customer = $this->customer($request);

        $latestBill = Bill::where('customer_id', $customer->id)
            ->orderByDesc('id')
            ->first(['id', 'invoice_number', 'bill_date', 'grand_total', 'paid_amount', 'status']);

        $openOrders = Order::where('customer_id', $customer->id)
            ->whereIn('status', [Order::STATUS_PENDING, Order::STATUS_REVIEWING, Order::STATUS_CONFIRMED, Order::STATUS_ON_HOLD])
            ->orderByDesc('id')
            ->limit(5)
            ->get(['id', 'order_number', 'order_date', 'status', 'submitted_at']);

        $balanceDue = (float) Bill::where('customer_id', $customer->id)
            ->whereIn('status', [Bill::STATUS_POSTED])
            ->sum(DB::raw('grand_total - paid_amount'));

        return Inertia::render('Portal/Home', [
            'customer' => $customer->only(['id', 'code', 'name', 'phone', 'address', 'current_balance', 'credit_limit']),
            'summary' => [
                'current_balance' => $customer->current_balance,
                'balance_due' => round($balanceDue, 2),
                'open_orders' => $openOrders->count(),
            ],
            'open_orders' => $openOrders,
            'latest_bill' => $latestBill,
        ]);
    }

    private function customer(Request $request): Customer
    {
        $customer = $request->user()?->customer;
        abort_if(! $customer, 403, 'No customer record linked to this account.');
        return $customer;
    }
}
