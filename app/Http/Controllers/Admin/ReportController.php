<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $from = $request->string('from')->value() ?: now()->startOfMonth()->toDateString();
        $to = $request->string('to')->value() ?: now()->toDateString();

        return Inertia::render('Admin/Reports/Index', [
            'filters' => ['from' => $from, 'to' => $to],
            'summary' => $this->summary($from, $to),
            'sales_by_day' => $this->salesByDay($from, $to),
            'aging' => $this->receivablesAging(),
            'top_customers' => $this->topCustomers($from, $to),
            'top_products' => $this->topProducts($from, $to),
            'collection_today' => $this->collectionByMethod(now()->toDateString(), now()->toDateString()),
            'stock_alerts' => $this->stockAlerts(),
        ]);
    }

    private function summary(string $from, string $to): array
    {
        $bills = Bill::where('status', Bill::STATUS_POSTED)
            ->whereBetween('bill_date', [$from, $to]);
        $payments = Payment::where('status', Payment::STATUS_ACTIVE)
            ->whereBetween('payment_date', [$from, $to]);

        return [
            'sales_total' => round((float) (clone $bills)->sum('grand_total'), 2),
            'bills_count' => (clone $bills)->count(),
            'payments_total' => round((float) (clone $payments)->sum('amount'), 2),
            'receivables_total' => round((float) Customer::sum('current_balance'), 2),
            'open_orders' => Order::whereIn('status', [Order::STATUS_PENDING, Order::STATUS_REVIEWING, Order::STATUS_CONFIRMED, Order::STATUS_ON_HOLD])->count(),
        ];
    }

    private function salesByDay(string $from, string $to): array
    {
        return Bill::where('status', Bill::STATUS_POSTED)
            ->whereBetween('bill_date', [$from, $to])
            ->groupBy('bill_date')
            ->orderBy('bill_date')
            ->select('bill_date', DB::raw('SUM(grand_total) as total'), DB::raw('COUNT(*) as count'))
            ->get()
            ->map(fn ($r) => [
                'date' => $r->bill_date->toDateString(),
                'total' => round((float) $r->total, 2),
                'count' => (int) $r->count,
            ])
            ->all();
    }

    private function receivablesAging(): array
    {
        $buckets = ['current' => 0.0, '1_30' => 0.0, '31_60' => 0.0, '61_90' => 0.0, '90_plus' => 0.0];
        $today = now()->startOfDay();

        Bill::where('status', Bill::STATUS_POSTED)
            ->whereColumn('paid_amount', '<', 'grand_total')
            ->select('id', 'bill_date', 'grand_total', 'paid_amount')
            ->orderBy('bill_date')
            ->chunk(500, function ($bills) use (&$buckets, $today) {
                foreach ($bills as $b) {
                    $due = (float) $b->grand_total - (float) $b->paid_amount;
                    if ($due <= 0) continue;
                    $days = $today->diffInDays($b->bill_date, true);
                    if ($days <= 0) $buckets['current'] += $due;
                    elseif ($days <= 30) $buckets['1_30'] += $due;
                    elseif ($days <= 60) $buckets['31_60'] += $due;
                    elseif ($days <= 90) $buckets['61_90'] += $due;
                    else $buckets['90_plus'] += $due;
                }
            });

        return array_map(fn ($v) => round($v, 2), $buckets);
    }

    private function topCustomers(string $from, string $to): array
    {
        return Bill::where('status', Bill::STATUS_POSTED)
            ->whereBetween('bill_date', [$from, $to])
            ->join('customers', 'customers.id', '=', 'bills.customer_id')
            ->groupBy('customers.id', 'customers.code', 'customers.name')
            ->orderByRaw('SUM(grand_total) DESC')
            ->limit(10)
            ->select(
                'customers.id',
                'customers.code',
                'customers.name',
                DB::raw('SUM(grand_total) as total'),
                DB::raw('COUNT(*) as bills_count'),
            )
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'code' => $r->code,
                'name' => $r->name,
                'total' => round((float) $r->total, 2),
                'bills_count' => (int) $r->bills_count,
            ])
            ->all();
    }

    private function topProducts(string $from, string $to): array
    {
        return DB::table('bill_items')
            ->join('bills', 'bills.id', '=', 'bill_items.bill_id')
            ->where('bills.status', Bill::STATUS_POSTED)
            ->whereBetween('bills.bill_date', [$from, $to])
            ->groupBy('bill_items.product_id', 'bill_items.product_name', 'bill_items.product_sku')
            ->orderByRaw('SUM(bill_items.quantity) DESC')
            ->limit(10)
            ->select(
                'bill_items.product_id',
                'bill_items.product_name',
                'bill_items.product_sku',
                DB::raw('SUM(bill_items.quantity) as qty'),
                DB::raw('SUM(bill_items.line_total) as revenue'),
            )
            ->get()
            ->map(fn ($r) => [
                'product_id' => $r->product_id,
                'name' => $r->product_name,
                'sku' => $r->product_sku,
                'qty' => (int) $r->qty,
                'revenue' => round((float) $r->revenue, 2),
            ])
            ->all();
    }

    private function collectionByMethod(string $from, string $to): array
    {
        return Payment::where('status', Payment::STATUS_ACTIVE)
            ->whereBetween('payment_date', [$from, $to])
            ->groupBy('method')
            ->select('method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->get()
            ->map(fn ($r) => [
                'method' => $r->method,
                'total' => round((float) $r->total, 2),
                'count' => (int) $r->count,
            ])
            ->all();
    }

    private function stockAlerts(): array
    {
        return Product::query()
            ->where('is_active', true)
            ->withSum('stocks as total_stock', 'quantity')
            ->orderBy('total_stock')
            ->limit(20)
            ->get(['id', 'sku', 'name', 'reorder_level', 'unit'])
            ->filter(fn ($p) => (int) $p->total_stock <= $p->reorder_level)
            ->values()
            ->map(fn ($p) => [
                'id' => $p->id,
                'sku' => $p->sku,
                'name' => $p->name,
                'unit' => $p->unit,
                'stock' => (int) $p->total_stock,
                'reorder_level' => (int) $p->reorder_level,
            ])
            ->all();
    }
}
