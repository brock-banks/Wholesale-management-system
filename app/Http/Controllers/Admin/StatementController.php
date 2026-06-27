<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\LedgerEntry;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class StatementController extends Controller
{
    public function show(Request $request, Customer $customer): Response
    {
        [$from, $to] = $this->dateRange($request);
        $data = $this->buildStatement($customer, $from, $to);

        return Inertia::render('Admin/Statements/Show', [
            'customer' => $customer->only([
                'id', 'code', 'name', 'phone', 'address', 'email',
                'opening_balance', 'current_balance', 'credit_limit',
            ]),
            'filters' => ['from' => $from, 'to' => $to],
            ...$data,
        ]);
    }

    public function pdf(Request $request, Customer $customer): HttpResponse
    {
        [$from, $to] = $this->dateRange($request);
        $data = $this->buildStatement($customer, $from, $to);

        $pdf = Pdf::loadView('pdf.statement', [
            'customer' => $customer,
            'filters' => ['from' => $from, 'to' => $to],
            'opening' => $data['opening_balance'],
            'closing' => $data['closing_balance'],
            'totalDebit' => $data['period_debit'],
            'totalCredit' => $data['period_credit'],
            'entries' => $data['entries'],
            'business' => \App\Support\BusinessSettings::forPdf(),
        ])->setPaper('A4');

        $filename = "statement-{$customer->code}-{$from}-to-{$to}.pdf";

        return $pdf->stream($filename);
    }

    private function dateRange(Request $request): array
    {
        $from = $request->string('from')->value() ?: now()->startOfMonth()->subMonths(2)->toDateString();
        $to = $request->string('to')->value() ?: now()->toDateString();

        return [$from, $to];
    }

    private function buildStatement(Customer $customer, string $from, string $to): array
    {
        $openingBalance = (float) LedgerEntry::query()
            ->where('customer_id', $customer->id)
            ->where('entry_date', '<', $from)
            ->orderByDesc('id')
            ->value('running_balance') ?? 0;

        $entries = LedgerEntry::query()
            ->where('customer_id', $customer->id)
            ->whereBetween('entry_date', [$from, $to])
            ->orderBy('entry_date')
            ->orderBy('id')
            ->get([
                'id', 'entry_date', 'type',
                'reference_type', 'reference_id',
                'debit', 'credit', 'running_balance', 'description',
            ])
            ->map(function (LedgerEntry $e) {
                $ref = null;
                if ($e->reference_type && $e->reference_id) {
                    $model = $e->reference_type::find($e->reference_id);
                    if ($model) {
                        $ref = match ($e->reference_type) {
                            \App\Models\Bill::class => ['type' => 'bill', 'id' => $model->id, 'label' => $model->invoice_number, 'notes' => $model->notes],
                            \App\Models\Payment::class => ['type' => 'payment', 'id' => $model->id, 'label' => $model->payment_number, 'notes' => $model->notes],
                            default => null,
                        };
                    }
                }

                return [
                    'id' => $e->id,
                    'entry_date' => $e->entry_date->toDateString(),
                    'type' => $e->type,
                    'debit' => (float) $e->debit,
                    'credit' => (float) $e->credit,
                    'running_balance' => (float) $e->running_balance,
                    'description' => $e->description,
                    'reference' => $ref,
                ];
            });

        $periodDebit = (float) $entries->sum('debit');
        $periodCredit = (float) $entries->sum('credit');
        $closingBalance = $openingBalance + $periodDebit - $periodCredit;

        return [
            'opening_balance' => round($openingBalance, 2),
            'closing_balance' => round($closingBalance, 2),
            'period_debit' => round($periodDebit, 2),
            'period_credit' => round($periodCredit, 2),
            'entries' => $entries->values(),
        ];
    }
}
