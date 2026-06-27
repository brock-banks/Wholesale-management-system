<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Admin\StatementController;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class PortalStatementController extends Controller
{
    public function __construct(private readonly StatementController $admin) {}

    public function show(Request $request): Response
    {
        $customer = $request->user()->customer;
        abort_if(! $customer, 403);

        $reflect = new \ReflectionClass($this->admin);
        $build = $reflect->getMethod('buildStatement');
        $build->setAccessible(true);
        $range = $reflect->getMethod('dateRange');
        $range->setAccessible(true);

        [$from, $to] = $range->invoke($this->admin, $request);
        $data = $build->invoke($this->admin, $customer, $from, $to);

        return Inertia::render('Portal/Statement', [
            'customer' => $customer->only(['id', 'code', 'name', 'phone', 'address', 'current_balance', 'credit_limit']),
            'filters' => ['from' => $from, 'to' => $to],
            ...$data,
        ]);
    }

    public function pdf(Request $request): HttpResponse
    {
        $customer = $request->user()->customer;
        abort_if(! $customer, 403);
        $request->merge(['customer' => $customer]);

        return $this->admin->pdf($request, $customer);
    }
}
